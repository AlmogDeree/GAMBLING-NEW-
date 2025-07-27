// הוסף את זה בסוף הקובץ backend/server.js, לפני app.listen

// Middleware למנהל (לעכשיו פשוט בודק שהמשתמש קיים)
const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'אין טוקן אימות' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'משתמש לא נמצא' });
    }

    // לעכשיו כל משתמש הוא מנהל - בעתיד נוסיף שדה isAdmin
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'טוקן לא חוקי' });
  }
};

// ===== ADMIN ROUTES =====

// סטטיסטיקות כלליות
app.get('/api/admin/stats', adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalBets = await Bet.countDocuments();
    const totalWins = await Bet.countDocuments({ won: true });
    
    const revenueData = await Bet.aggregate([
      {
        $group: {
          _id: null,
          totalBetAmount: { $sum: '$betAmount' },
          totalWinAmount: { $sum: '$winAmount' },
          houseRevenue: { $sum: { $subtract: ['$betAmount', '$winAmount'] } }
        }
      }
    ]);

    const revenue = revenueData[0] || { 
      totalBetAmount: 0, 
      totalWinAmount: 0, 
      houseRevenue: 0 
    };

    // משתמשים פעילים (הימורים ב-7 ימים האחרונים)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activeUsers = await Bet.distinct('userId', { 
      createdAt: { $gte: sevenDaysAgo } 
    }).then(userIds => userIds.length);

    // הימורים היום
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const betsToday = await Bet.countDocuments({ 
      createdAt: { $gte: today } 
    });

    res.json({
      totalUsers,
      totalBets,
      totalWins,
      winRate: totalBets > 0 ? ((totalWins / totalBets) * 100).toFixed(1) : 0,
      revenue,
      activeUsers,
      betsToday
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// רשימת משתמשים
app.get('/api/admin/users', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // הוספת סטטיסטיקות לכל משתמש
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const userBets = await Bet.countDocuments({ userId: user._id });
        const userWins = await Bet.countDocuments({ userId: user._id, won: true });
        const userProfit = await Bet.aggregate([
          { $match: { userId: user._id } },
          {
            $group: {
              _id: null,
              totalBet: { $sum: '$betAmount' },
              totalWin: { $sum: '$winAmount' }
            }
          }
        ]);

        const profit = userProfit[0] || { totalBet: 0, totalWin: 0 };

        return {
          ...user.toObject(),
          stats: {
            totalBets: userBets,
            totalWins: userWins,
            winRate: userBets > 0 ? ((userWins / userBets) * 100).toFixed(1) : 0,
            netProfit: profit.totalWin - profit.totalBet
          }
        };
      })
    );

    const totalUsers = await User.countDocuments();

    res.json({
      users: usersWithStats,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// רשימת הימורים אחרונים
app.get('/api/admin/recent-bets', adminAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    const recentBets = await Bet.find({})
      .populate('userId', 'username email')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json(recentBets);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// נתונים גרפיים - הימורים לפי יום
app.get('/api/admin/chart-data', adminAuth, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const dailyData = await Bet.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
          },
          totalBets: { $sum: 1 },
          totalWins: { $sum: { $cond: ['$won', 1, 0] } },
          totalAmount: { $sum: '$betAmount' },
          totalWinAmount: { $sum: '$winAmount' }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    res.json(dailyData);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// עדכון יתרת משתמש (מנהל בלבד)
app.post('/api/admin/update-balance', adminAuth, async (req, res) => {
  try {
    const { userId, newBalance, reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'משתמש לא נמצא' });
    }

    user.balance = newBalance;
    await user.save();

    // כאן אפשר לשמור לוג של השינוי
    console.log(`Admin updated user ${user.username} balance to ${newBalance}. Reason: ${reason}`);

    res.json({ 
      message: 'יתרה עודכנה בהצלחה', 
      user: {
        id: user._id,
        username: user.username,
        balance: user.balance
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});