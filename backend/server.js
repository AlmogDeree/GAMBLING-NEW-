require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const socketIo = require('socket.io');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const cron = require('node-cron');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true
  }
});

// Import models
const User = require('./models/User');
const Bet = require('./models/Bet');
const DailyBonus = require('./models/DailyBonus');
const Referral = require('./models/Referral');

// ===== MIDDLEWARE =====

// Security middleware
app.use(helmet());
app.use(mongoSanitize());

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parser
app.use(express.json());

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

const betLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30 // limit each IP to 30 bets per minute
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later'
});

app.use('/api/', generalLimiter);

// ===== DATABASE CONNECTION =====
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/betonnumber', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// ===== AUTHENTICATION MIDDLEWARE =====
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No authentication token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Admin middleware
const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No authentication token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// ===== SOCKET.IO =====
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  socket.on('authenticate', (userId) => {
    connectedUsers.set(userId, socket.id);
    socket.userId = userId;
  });
  
  socket.on('disconnect', () => {
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
    }
    console.log('User disconnected:', socket.id);
  });
});

// ===== HELPER FUNCTIONS =====

const getTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';
  
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';
  
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';
  
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';
  
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' minutes ago';
  
  return Math.floor(seconds) + ' seconds ago';
};

// Calculate VIP Level
const calculateVIPLevel = (totalBets) => {
  if (totalBets >= 5000) return 'DIAMOND';
  if (totalBets >= 1000) return 'PLATINUM';
  if (totalBets >= 500) return 'GOLD';
  if (totalBets >= 100) return 'SILVER';
  return 'BRONZE';
};

// VIP Benefits
const getVIPBenefits = (level) => {
  const benefits = {
    BRONZE: { cashback: 0.01, bonusMultiplier: 1 },
    SILVER: { cashback: 0.02, bonusMultiplier: 1.2 },
    GOLD: { cashback: 0.03, bonusMultiplier: 1.5 },
    PLATINUM: { cashback: 0.05, bonusMultiplier: 2 },
    DIAMOND: { cashback: 0.1, bonusMultiplier: 3 }
  };
  return benefits[level];
};

// Near-Miss Detection
const detectNearMiss = (selectedNumber, systemNumbers, range) => {
  let nearMissLevel = 0;
  
  for (const num of systemNumbers) {
    const diff = Math.abs(num - selectedNumber);
    if (diff === 1) {
      nearMissLevel = 3; // Very close
      break;
    } else if (diff === 2) {
      nearMissLevel = Math.max(nearMissLevel, 2); // Close
    } else if (diff <= 3) {
      nearMissLevel = Math.max(nearMissLevel, 1); // Somewhat close
    }
  }
  
  return nearMissLevel;
};

// ===== USER ROUTES =====

// Register with referral
app.post('/api/register', loginLimiter, async (req, res) => {
  try {
    const { username, email, password, referralCode } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Username or email already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user with welcome bonus
    const user = new User({
      username,
      email,
      password: hashedPassword,
      balance: 1000, // Welcome bonus
      welcomeBonusReceived: true
    });

    // Generate referral code for new user
    user.referralCode = user.generateReferralCode();

    // Check if referred by someone
    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer) {
        user.referredBy = referrer._id;
        referrer.referralCount += 1;
        await referrer.save();
        
        // Create referral record
        const referral = new Referral({
          referrer: referrer._id,
          referred: user._id,
          referralCode: referralCode,
          commissionRate: 0.15 // 15%
        });
        await referral.save();
      }
    }

    await user.save();

    // Create token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        balance: user.balance,
        vipLevel: 'BRONZE',
        isAdmin: false,
        referralCode: user.referralCode
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
app.post('/api/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update last login and check streak
    const lastLogin = user.lastLogin;
    const now = new Date();
    user.lastLogin = now;
    
    // Update login streak
    if (lastLogin) {
      const daysSinceLastLogin = (now - lastLogin) / (1000 * 60 * 60 * 24);
      if (daysSinceLastLogin <= 1.5) {
        user.loginStreak.count += 1;
      } else {
        user.loginStreak.count = 1;
      }
    } else {
      user.loginStreak.count = 1;
    }
    user.loginStreak.lastLoginDate = now;
    
    await user.save();

    // Create token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    const vipLevel = calculateVIPLevel(user.totalBets);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        balance: user.balance,
        vipLevel,
        isAdmin: user.isAdmin || false,
        referralCode: user.referralCode,
        loginStreak: user.loginStreak.count
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user details
app.get('/api/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password')
      .populate('referredBy', 'username');
    
    const vipLevel = calculateVIPLevel(user.totalBets);
    
    res.json({
      ...user.toObject(),
      vipLevel,
      vipBenefits: getVIPBenefits(vipLevel),
      isAdmin: user.isAdmin || false
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Place bet with enhanced features
app.post('/api/bet', auth, betLimiter, async (req, res) => {
  try {
    const { selectedNumber, range, attempts, betAmount } = req.body;
    
    // Get user
    const user = await User.findById(req.user.userId);
    
    if (user.balance < betAmount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Calculate odds
    const probability = 1 - Math.pow(1 - (1 / range), attempts);
    const houseEdge = 0.8;
    const payoutRatio = (1 / probability) * houseEdge;
    const potentialWin = Math.round(betAmount * payoutRatio);

    // Generate system numbers
    const systemNumbers = [];
    for (let i = 0; i < attempts; i++) {
      systemNumbers.push(Math.floor(Math.random() * range) + 1);
    }
    
    const won = systemNumbers.includes(selectedNumber);
    let winAmount = won ? potentialWin : 0;

    // Near-miss detection
    const nearMissLevel = detectNearMiss(selectedNumber, systemNumbers, range);

    // Apply VIP cashback if lost
    const vipLevel = calculateVIPLevel(user.totalBets);
    const vipBenefits = getVIPBenefits(vipLevel);
    let cashbackAmount = 0;
    
    if (!won && vipBenefits.cashback > 0) {
      cashbackAmount = Math.round(betAmount * vipBenefits.cashback);
      user.balance += cashbackAmount;
    }

    // Update user balance
    user.balance -= betAmount;
    if (won) {
      user.balance += winAmount;
    }
    
    // Update user statistics
    user.totalBets += 1;
    if (won) {
      user.totalWins += 1;
      user.totalWinAmount += winAmount;
    }
    
    await user.save();

    // Handle referral commission
    if (user.referredBy) {
      const referral = await Referral.findOne({ 
        referred: user._id,
        status: 'active' 
      });
      
      if (referral) {
        const commission = Math.round(betAmount * referral.commissionRate);
        const referrer = await User.findById(referral.referrer);
        
        if (referrer) {
          referrer.referralEarnings += commission;
          referrer.balance += commission;
          await referrer.save();
          
          referral.totalEarnings += commission;
          referral.totalDeposits += betAmount;
          referral.lastEarningDate = new Date();
          await referral.save();
          
          // Notify referrer via socket
          const referrerSocket = connectedUsers.get(referrer._id.toString());
          if (referrerSocket) {
            io.to(referrerSocket).emit('referral-earning', {
              amount: commission,
              fromUser: user.username,
              timestamp: new Date()
            });
          }
        }
      }
    }

    // Save bet
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
      vipLevel,
      cashbackAmount,
      nearMissLevel
    });

    await bet.save();

    // Check achievements
    const newAchievements = await user.checkAchievements();

    // Emit to all users if big win
    if (won && winAmount >= 1000) {
      io.emit('big-win', {
        username: user.username.substring(0, 4) + '***',
        amount: winAmount,
        timestamp: new Date()
      });
    }

    res.json({
      won,
      systemNumbers,
      winAmount,
      newBalance: user.balance,
      betId: bet._id,
      cashbackAmount,
      vipLevel,
      nearMissLevel,
      newAchievements
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get betting history
app.get('/api/bets', auth, async (req, res) => {
  try {
    const bets = await Bet.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json(bets);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user statistics
app.get('/api/user/stats', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const stats = await Bet.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalBets: { $sum: 1 },
          totalWins: { $sum: { $cond: ['$won', 1, 0] } },
          totalBetAmount: { $sum: '$betAmount' },
          totalWinAmount: { $sum: '$winAmount' },
          biggestWin: { $max: '$winAmount' },
          totalCashback: { $sum: '$cashbackAmount' }
        }
      }
    ]);

    const userStats = stats[0] || {
      totalBets: 0,
      totalWins: 0,
      totalBetAmount: 0,
      totalWinAmount: 0,
      biggestWin: 0,
      totalCashback: 0
    };

    userStats.winRate = userStats.totalBets > 0 
      ? ((userStats.totalWins / userStats.totalBets) * 100).toFixed(1) 
      : 0;
    
    userStats.profit = userStats.totalWinAmount - userStats.totalBetAmount + userStats.totalCashback;

    res.json(userStats);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Daily Bonus
app.post('/api/claim-daily-bonus', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    // Check last bonus claim
    const lastBonus = await DailyBonus.findOne({ 
      userId: user._id 
    }).sort({ createdAt: -1 });

    const now = new Date();
    const lastClaim = lastBonus ? new Date(lastBonus.createdAt) : null;
    
    if (lastClaim) {
      const hoursSinceLastClaim = (now - lastClaim) / (1000 * 60 * 60);
      if (hoursSinceLastClaim < 24) {
        return res.status(400).json({ 
          message: 'Daily bonus already claimed',
          hoursUntilNext: Math.ceil(24 - hoursSinceLastClaim)
        });
      }
    }

    // Calculate streak
    let streak = 1;
    if (lastClaim) {
      const daysSinceLastClaim = (now - lastClaim) / (1000 * 60 * 60 * 24);
      if (daysSinceLastClaim <= 2) {
        streak = (lastBonus.streak || 0) + 1;
      }
    }

    // Calculate bonus amount based on streak and VIP level
    const baseBonus = [10, 20, 30, 50, 75, 100, 200];
    const vipLevel = calculateVIPLevel(user.totalBets);
    const vipMultiplier = getVIPBenefits(vipLevel).bonusMultiplier;
    const bonusAmount = baseBonus[Math.min(streak - 1, 6)] * vipMultiplier;

    // Update user balance
    user.balance += bonusAmount;
    await user.save();

    // Save bonus claim
    const bonusClaim = new DailyBonus({
      userId: user._id,
      amount: bonusAmount,
      streak,
      vipLevel
    });
    await bonusClaim.save();

    res.json({
      success: true,
      amount: bonusAmount,
      streak,
      newBalance: user.balance,
      vipMultiplier
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get recent wins
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
    res.status(500).json({ message: 'Server error' });
  }
});

// Get hot and cold numbers
app.get('/api/number-stats', async (req, res) => {
  try {
    const range = parseInt(req.query.range) || 20;
    const hoursAgo = 24;
    const timeLimit = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    
    // Get winning numbers from recent bets
    const recentWins = await Bet.find({
      won: true,
      createdAt: { $gte: timeLimit },
      range: { $lte: range }
    }).select('selectedNumber');
    
    // Count frequency of each number
    const numberFrequency = {};
    recentWins.forEach(bet => {
      numberFrequency[bet.selectedNumber] = (numberFrequency[bet.selectedNumber] || 0) + 1;
    });
    
    // Sort numbers by frequency
    const sortedNumbers = Object.entries(numberFrequency)
      .map(([num, freq]) => ({ number: parseInt(num), frequency: freq }))
      .sort((a, b) => b.frequency - a.frequency);
    
    // Get hot numbers (top 5)
    const hot = sortedNumbers.slice(0, 5).map(item => item.number);
    
    // Get cold numbers (numbers that haven't appeared)
    const allNumbers = Array.from({ length: range }, (_, i) => i + 1);
    const appearedNumbers = new Set(Object.keys(numberFrequency).map(Number));
    const cold = allNumbers
      .filter(num => !appearedNumbers.has(num))
      .slice(0, 5);
    
    // If not enough cold numbers, add least frequent ones
    if (cold.length < 5) {
      const leastFrequent = sortedNumbers
        .slice(-5)
        .map(item => item.number)
        .filter(num => !cold.includes(num));
      cold.push(...leastFrequent.slice(0, 5 - cold.length));
    }
    
    res.json({ hot, cold });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Daily bonus status check
app.get('/api/daily-bonus/status', auth, async (req, res) => {
  try {
    const lastBonus = await DailyBonus.findOne({ 
      userId: req.user.userId 
    }).sort({ createdAt: -1 });
    
    let canClaim = true;
    let streak = 0;
    let hoursUntilNext = 0;
    
    if (lastBonus) {
      const hoursSinceLastClaim = (new Date() - lastBonus.createdAt) / (1000 * 60 * 60);
      canClaim = hoursSinceLastClaim >= 24;
      streak = lastBonus.streak || 0;
      
      if (!canClaim) {
        hoursUntilNext = 24 - hoursSinceLastClaim;
      }
    }
    
    res.json({ canClaim, streak, hoursUntilNext });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user preferences
app.patch('/api/user/preferences', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    Object.assign(user.preferences, req.body);
    await user.save();
    
    res.json({ message: 'Preferences updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const period = req.query.period || 'weekly';
    
    let dateFilter = {};
    const now = new Date();
    
    if (period === 'weekly') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { createdAt: { $gte: weekAgo } };
    } else if (period === 'monthly') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = { createdAt: { $gte: monthAgo } };
    }

    const leaderboard = await Bet.aggregate([
      { $match: { won: true, ...dateFilter } },
      {
        $group: {
          _id: '$userId',
          totalWins: { $sum: 1 },
          totalProfit: { $sum: { $subtract: ['$winAmount', '$betAmount'] } },
          biggestWin: { $max: '$winAmount' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          username: { $substr: ['$user.username', 0, 4] },
          totalWins: 1,
          totalProfit: 1,
          biggestWin: 1,
          vipLevel: {
            $cond: {
              if: { $gte: ['$user.totalBets', 5000] }, then: 'DIAMOND',
              else: {
                $cond: {
                  if: { $gte: ['$user.totalBets', 1000] }, then: 'PLATINUM',
                  else: {
                    $cond: {
                      if: { $gte: ['$user.totalBets', 500] }, then: 'GOLD',
                      else: {
                        $cond: {
                          if: { $gte: ['$user.totalBets', 100] }, then: 'SILVER',
                          else: 'BRONZE'
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      { $sort: { totalProfit: -1 } },
      { $limit: 10 }
    ]);

    res.json(leaderboard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== REFERRAL ROUTES =====

// Get referral stats
app.get('/api/referral/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    // Get all referrals
    const referrals = await Referral.find({ 
      referrer: user._id,
      status: 'active' 
    }).populate('referred', 'username createdAt totalBets');
    
    // Calculate stats
    const stats = {
      referralCode: user.referralCode,
      totalReferrals: referrals.length,
      totalEarnings: user.referralEarnings || 0,
      activeReferrals: referrals.filter(ref => {
        const lastActive = new Date(ref.lastEarningDate || 0);
        const daysSinceActive = (new Date() - lastActive) / (1000 * 60 * 60 * 24);
        return daysSinceActive < 30;
      }).length,
      referralList: referrals.map(ref => ({
        username: ref.referred.username.substring(0, 4) + '***',
        joinDate: ref.referred.createdAt,
        totalBets: ref.referred.totalBets,
        yourEarnings: ref.totalEarnings,
        status: ref.status
      }))
    };
    
    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== ADMIN ROUTES =====

// Admin statistics
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
          totalCashback: { $sum: '$cashbackAmount' },
          houseRevenue: { 
            $sum: { 
              $subtract: ['$betAmount', { $add: ['$winAmount', '$cashbackAmount'] }] 
            } 
          }
        }
      }
    ]);

    const revenue = revenueData[0] || { 
      totalBetAmount: 0, 
      totalWinAmount: 0,
      totalCashback: 0, 
      houseRevenue: 0 
    };

    // Active users (bets in last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activeUsers = await Bet.distinct('userId', { 
      createdAt: { $gte: sevenDaysAgo } 
    }).then(userIds => userIds.length);

    // Bets today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const betsToday = await Bet.countDocuments({ 
      createdAt: { $gte: today } 
    });

    // VIP distribution
    const vipDistribution = await User.aggregate([
      {
        $project: {
          vipLevel: {
            $cond: {
              if: { $gte: ['$totalBets', 5000] }, then: 'DIAMOND',
              else: {
                $cond: {
                  if: { $gte: ['$totalBets', 1000] }, then: 'PLATINUM',
                  else: {
                    $cond: {
                      if: { $gte: ['$totalBets', 500] }, then: 'GOLD',
                      else: {
                        $cond: {
                          if: { $gte: ['$totalBets', 100] }, then: 'SILVER',
                          else: 'BRONZE'
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      {
        $group: {
          _id: '$vipLevel',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      totalUsers,
      totalBets,
      totalWins,
      winRate: totalBets > 0 ? ((totalWins / totalBets) * 100).toFixed(1) : 0,
      revenue,
      activeUsers,
      betsToday,
      vipDistribution
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get users list
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

    // Add statistics for each user
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
              totalWin: { $sum: '$winAmount' },
              totalCashback: { $sum: '$cashbackAmount' }
            }
          }
        ]);

        const profit = userProfit[0] || { totalBet: 0, totalWin: 0, totalCashback: 0 };
        const vipLevel = calculateVIPLevel(user.totalBets);

        return {
          ...user.toObject(),
          vipLevel,
          stats: {
            totalBets: userBets,
            totalWins: userWins,
            winRate: userBets > 0 ? ((userWins / userBets) * 100).toFixed(1) : 0,
            netProfit: profit.totalWin + profit.totalCashback - profit.totalBet
          }
        };
      })
    );

    const totalUsers = await User.countDocuments();

    res.json({
      users: usersWithStats,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      totalUsers
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get recent bets
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
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user balance
app.post('/api/admin/update-balance', adminAuth, async (req, res) => {
  try {
    const { userId, newBalance, reason } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const oldBalance = user.balance;
    user.balance = newBalance;
    await user.save();

    // Log the balance change
    console.log(`Admin balance update: User ${user.username} from $${oldBalance} to $${newBalance}. Reason: ${reason}`);

    res.json({ 
      message: 'Balance updated successfully',
      oldBalance,
      newBalance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cron job for daily tasks
cron.schedule('0 0 * * *', async () => {
  console.log('Running daily maintenance tasks...');
  
  // Clean up old sessions
  // Add any other daily maintenance tasks here
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});