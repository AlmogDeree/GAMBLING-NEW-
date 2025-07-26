const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// חיבור למסד נתונים MongoDB (מקומי)
mongoose.connect('mongodb://localhost:27017/bet-on-number', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.log('❌ MongoDB connection error:', err));

// מודלים
const User = require('./models/User');
const Bet = require('./models/Bet');

// Middleware לאימות JWT
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'אין טוקן אימות' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'טוקן לא חוקי' });
  }
};

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

// ===== USER ROUTES =====

// הרשמה
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // בדיקה אם המשתמש קיים
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'שם המשתמש או האימייל כבר קיימים' 
      });
    }

    // הצפנת הסיסמה
    const hashedPassword = await bcrypt.hash(password, 12);

    // יצירת משתמש חדש
    const user = new User({
      username,
      email,
      password: hashedPassword,
      balance: 1000, // יתרה התחלתית
    });

    await user.save();

    // יצירת טוקן
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'משתמש נוצר בהצלחה',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        balance: user.balance,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// התחברות
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // חיפוש המשתמש
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'פרטי התחברות שגויים' });
    }

    // בדיקת הסיסמה
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'פרטי התחברות שגויים' });
    }

    // יצירת טוקן
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'התחברות בוצעה בהצלחה',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        balance: user.balance,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// קבלת פרטי המשתמש
app.get('/api/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// ביצוע הימור
app.post('/api/bet', auth, async (req, res) => {
  try {
    const { selectedNumber, range, attempts, betAmount } = req.body;
    
    // קבלת פרטי המשתמש
    const user = await User.findById(req.user.userId);
    
    if (user.balance < betAmount) {
      return res.status(400).json({ message: 'יתרה לא מספיקה' });
    }

    // חישוב הסיכויים (כמו בפרונטנד)
    const probability = 1 - Math.pow(1 - (1 / range), attempts);
    const houseEdge = 0.8;
    const payoutRatio = (1 / probability) * houseEdge;
    const potentialWin = Math.round(betAmount * payoutRatio);

    // יצירת המספרים הנבחרים על ידי המערכת
    const systemNumbers = [];
    for (let i = 0; i < attempts; i++) {
      systemNumbers.push(Math.floor(Math.random() * range) + 1);
    }
    
    const won = systemNumbers.includes(selectedNumber);
    const winAmount = won ? potentialWin : 0;

    // עדכון יתרת המשתמש
    user.balance -= betAmount;
    if (won) {
      user.balance += winAmount;
    }
    await user.save();

    // שמירת ההימור במסד הנתונים
    const bet = new Bet({
      userId: user._id,
      selectedNumber,
      range,
      attempts,
      betAmount,
      systemNumbers,
      won,
      winAmount,
      probability: probability * 100,
      payoutRatio,
    });

    await bet.save();

    res.json({
      won,
      systemNumbers,
      winAmount,
      newBalance: user.balance,
      betId: bet._id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// קבלת היסטוריית הימורים
app.get('/api/bets', auth, async (req, res) => {
  try {
    const bets = await Bet.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json(bets);
  } catch (error) {
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// קבלת זכיות אחרונות (כללי)
app.get('/api/recent-wins', async (req, res) => {
  try {
    const recentWins = await Bet.find({ won: true })
      .populate('userId', 'username')
      .sort({ createdAt: -1 })
      .limit(10);

    const formattedWins = recentWins.map(bet => ({
      user: bet.userId.username.substring(0, 4) + '***',
      bet: bet.betAmount,
      win: bet.winAmount,
      time: getTimeAgo(bet.createdAt),
    }));

    res.json(formattedWins);
  } catch (error) {
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

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

// פונקציה עזר לחישוב זמן
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return 'עכשיו';
  if (seconds < 3600) return `לפני ${Math.floor(seconds / 60)} דקות`;
  if (seconds < 86400) return `לפני ${Math.floor(seconds / 3600)} שעות`;
  return `לפני ${Math.floor(seconds / 86400)} ימים`;
}

// הפעלת השרת
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

module.exports = app;