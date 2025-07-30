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
    origin: [
      'https://betonnum.com',
      'https://www.betonnum.com',
      process.env.CLIENT_URL || "http://localhost:3000"
    ],
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

app.use(cors({
  origin: [
    'https://betonnum.com',
    'betonnum.com',
    'https://www.betonnum.com',
    'https://api.betonnum.com',
    'http://localhost:3000',
    'http://192.248.151.61:3000',
    process.env.CLIENT_URL
  ],
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
.then(() => {
  console.log('✅ MongoDB connected successfully');
  console.log('Database:', process.env.MONGODB_URI || 'mongodb://localhost:27017/betonnumber');
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Monitor MongoDB connection
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed.');
  process.exit(0);
});

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
  if (totalBets >= 10000) return 'DIAMOND';
  if (totalBets >= 5000) return 'PLATINUM';
  if (totalBets >= 1000) return 'GOLD';
  if (totalBets >= 100) return 'SILVER';
  return 'BRONZE';
};

// Calculate VIP Multipliers
const getVIPMultiplier = (vipLevel) => {
  const multipliers = {
    BRONZE: 1.0,
    SILVER: 1.1,
    GOLD: 1.2,
    PLATINUM: 1.3,
    DIAMOND: 1.5
  };
  return multipliers[vipLevel] || 1.0;
};

// Calculate Cashback
const calculateCashback = (betAmount, vipLevel) => {
  const cashbackRates = {
    BRONZE: 0.01,
    SILVER: 0.015,
    GOLD: 0.02,
    PLATINUM: 0.025,
    DIAMOND: 0.03
  };
  return Math.round(betAmount * (cashbackRates[vipLevel] || 0.01));
};

// Calculate Near Miss
const calculateNearMiss = (selectedNumbers, systemNumbers) => {
  let maxNearMissLevel = 0;
  
  for (const selected of selectedNumbers) {
    for (const system of systemNumbers) {
      const diff = Math.abs(selected - system);
      if (diff === 1) maxNearMissLevel = Math.max(maxNearMissLevel, 3);
      else if (diff === 2) maxNearMissLevel = Math.max(maxNearMissLevel, 2);
      else if (diff === 3) maxNearMissLevel = Math.max(maxNearMissLevel, 1);
    }
  }
  
  return maxNearMissLevel;
};

// Generate unique referral code
const generateReferralCode = async () => {
  let code;
  let isUnique = false;
  
  while (!isUnique) {
    code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const existing = await User.findOne({ referralCode: code });
    if (!existing) isUnique = true;
  }
  
  return code;
};

// ===== AUTHENTICATION ROUTES =====

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password, referralCode } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.email === email ? 'Email already exists' : 'Username already exists'
      });
    }

    // Hash password
    const hashedPassword = password;

    // Generate unique referral code
    const newReferralCode = await generateReferralCode();

    // Create user with welcome bonus
    const user = new User({
      username,
      email,
      password: hashedPassword,
      referralCode: newReferralCode,
      balance: 1000, // Welcome bonus
      totalBets: 0,
      totalWins: 0,
      loginStreak: { count: 1, lastLoginDate: new Date() }
    });

    // Handle referral if provided
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
      return res.status(400).json({ message: 'User does not exist' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Incorrect password' });
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
    console.log('Getting user details for ID:', req.user.userId);
    
    const user = await User.findById(req.user.userId)
      .select('-password')
      .populate('referredBy', 'username');
    
    if (!user) {
      console.log('User not found for ID:', req.user.userId);
      return res.status(404).json({ message: 'User not found' });
    }
    
    const vipLevel = calculateVIPLevel(user.totalBets);
    
    const userResponse = {
      ...user.toObject(),
      vipLevel,
      isAdmin: user.isAdmin || false
    };
    
    console.log('User details retrieved successfully for:', user.username);
    res.json(userResponse);
  } catch (error) {
    console.error('Error getting user details:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ===== GAME ROUTES - NEW MULTI-NUMBER LOGIC =====

// Play game with new multi-number system
app.post('/api/play', auth, betLimiter, async (req, res) => {
  try {
    const { selectedNumbers, range, betAmount } = req.body;
    
    // Validation
    if (!selectedNumbers || !Array.isArray(selectedNumbers) || selectedNumbers.length === 0) {
      return res.status(400).json({ message: 'Must select at least one number' });
    }
    
    if (betAmount < 1 || betAmount > 10000) {
      return res.status(400).json({ message: 'Invalid bet amount' });
    }

    if (!range || range < 1 || range > 100) {
      return res.status(400).json({ message: 'Invalid range' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.balance < betAmount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

     // Generate SINGLE system number (one number only per round)
    const systemNumbers = [];
    const singleRandomNumber = Math.floor(Math.random() * range) + 1;
    systemNumbers.push(singleRandomNumber);
    
    

    // Check for wins
    const winningNumbers = selectedNumbers.filter(num => systemNumbers.includes(num));
    const won = winningNumbers.length > 0;
    
    // Calculate winnings
    let winAmount = 0;
    if (won) {
      const probability = selectedNumbers.length / range;
      const houseEdge = 0.8;
      const payoutMultiplier = (1 / probability) * houseEdge;
      winAmount = Math.round(betAmount * payoutMultiplier);
    }

    // Get VIP level and multiplier
    const vipLevel = calculateVIPLevel(user.totalBets);
    const vipMultiplier = getVIPMultiplier(vipLevel);
    
    // Apply VIP bonus to winnings
    if (won && vipMultiplier > 1) {
      winAmount = Math.round(winAmount * vipMultiplier);
    }

    // Calculate cashback for losses
    const cashbackAmount = won ? 0 : calculateCashback(betAmount, vipLevel);

    // Calculate near miss
    const nearMissLevel = won ? 0 : calculateNearMiss(selectedNumbers, systemNumbers);

    // Update user balance
    user.balance -= betAmount;
    if (won) {
      user.balance += winAmount;
    } else {
      user.balance += cashbackAmount;
    }
    
    // Update user stats
    user.totalBets += 1;
    if (won) {
      user.totalWins += 1;
    }

    // Check for achievements
    let newAchievements = [];
    try {
      if (user.checkAchievements) {
        newAchievements = await user.checkAchievements();
      }
    } catch (achievementError) {
      console.error('Achievement check error:', achievementError);
    }

    await user.save();

    // Create bet record
    const bet = new Bet({
      userId: user._id,
      selectedNumbers,
      systemNumbers,
      winningNumbers,
      range,
      betAmount,
      won,
      winAmount: won ? winAmount : 0,
      cashbackAmount,
      nearMissLevel,
      vipLevelAtBet: vipLevel,
      gameType: 'multi_number'
    });

    await bet.save();

    // Handle referral earnings
    if (!won) {
      try {
        const referral = await Referral.findOne({ referred: user._id, status: 'active' });
        if (referral) {
          const referrer = await User.findById(referral.referrer);
          if (referrer) {
            const commission = Math.round(betAmount * 0.15);
            referrer.balance += commission;
            referrer.referralEarnings = (referrer.referralEarnings || 0) + commission;
            await referrer.save();
            
            referral.totalEarnings = (referral.totalEarnings || 0) + commission;
            referral.lastEarningDate = new Date();
            await referral.save();
          }
        }
      } catch (referralError) {
        console.error('Referral processing error:', referralError);
      }
    }

    // Emit real-time update to connected users
    if (won && io) {
      io.emit('newWin', {
        username: user.username.substring(0, 4) + '***',
        winAmount,
        timestamp: new Date()
      });
    }

    res.json({
      won,
      winAmount: won ? winAmount : 0,
      cashbackAmount,
      systemNumbers,
      selectedNumbers,
      winningNumbers,
      nearMissLevel,
      newBalance: user.balance,
      vipLevel,
      newAchievements
    });

  } catch (error) {
    console.error('Game play error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get betting history
app.get('/api/history', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const bets = await Bet.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Bet.countDocuments({ userId: req.user.userId });

    res.json({
      bets,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    console.error(error);
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

// Get recent wins
app.get('/api/recent-wins', async (req, res) => {
  try {
    const recentWins = await Bet.find({ won: true })
      .populate('userId', 'username')
      .sort({ createdAt: -1 })
      .limit(20)
      .select('winAmount createdAt userId');

    const formattedWins = recentWins.map(win => ({
      username: win.userId.username,
      winAmount: win.winAmount,
      createdAt: win.createdAt
    }));

    res.json(formattedWins);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get number statistics
app.get('/api/number-stats', async (req, res) => {
  try {
    const range = parseInt(req.query.range) || 10;
    
    const hotNumbers = await Bet.aggregate([
      { $unwind: '$systemNumbers' },
      { $group: { _id: '$systemNumbers', count: { $sum: 1 } } },
      { $match: { _id: { $lte: range } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const coldNumbers = await Bet.aggregate([
      { $unwind: '$systemNumbers' },
      { $group: { _id: '$systemNumbers', count: { $sum: 1 } } },
      { $match: { _id: { $lte: range } } },
      { $sort: { count: 1 } },
      { $limit: 5 }
    ]);

    res.json({ hot: hotNumbers, cold: coldNumbers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const leaderboard = await Bet.aggregate([
      {
        $group: {
          _id: '$userId',
          totalProfit: {
            $sum: {
              $subtract: [
                { $add: ['$winAmount', '$cashbackAmount'] },
                '$betAmount'
              ]
            }
          },
          totalBets: { $sum: 1 },
          totalWins: { $sum: { $cond: ['$won', 1, 0] } }
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
          username: '$user.username',
          totalProfit: 1,
          totalBets: 1,
          totalWins: 1,
          vipLevel: {
            $cond: {
              if: { $gte: ['$user.totalBets', 10000] }, then: 'DIAMOND',
              else: {
                $cond: {
                  if: { $gte: ['$user.totalBets', 5000] }, then: 'PLATINUM',
                  else: {
                    $cond: {
                      if: { $gte: ['$user.totalBets', 1000] }, then: 'GOLD',
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

// ===== DAILY BONUS ROUTES =====

// Check daily bonus status
app.get('/api/daily-bonus/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const lastBonus = await DailyBonus.findOne({ 
      userId: user._id 
    }).sort({ createdAt: -1 });

    const now = new Date();
    const lastClaim = lastBonus ? new Date(lastBonus.createdAt) : null;
    
    let canClaim = true;
    let hoursUntilNext = 0;
    let streak = 0;

    if (lastClaim) {
      const hoursSinceLastClaim = (now - lastClaim) / (1000 * 60 * 60);
      canClaim = hoursSinceLastClaim >= 20; // Can claim every 20 hours
      
      if (!canClaim) {
        hoursUntilNext = 20 - hoursSinceLastClaim;
      }
      
      // Calculate streak
      const daysSinceLastClaim = hoursSinceLastClaim / 24;
      if (daysSinceLastClaim <= 1.5) {
        streak = lastBonus.streak;
      }
    }

    res.json({
      canClaim,
      hoursUntilNext,
      streak,
      nextBonusAmount: calculateDailyBonusAmount(streak + 1, calculateVIPLevel(user.totalBets))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Claim daily bonus
app.post('/api/daily-bonus/claim', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const lastBonus = await DailyBonus.findOne({ 
      userId: user._id 
    }).sort({ createdAt: -1 });

    const now = new Date();
    const lastClaim = lastBonus ? new Date(lastBonus.createdAt) : null;
    
    // Check if can claim
    if (lastClaim) {
      const hoursSinceLastClaim = (now - lastClaim) / (1000 * 60 * 60);
      if (hoursSinceLastClaim < 20) {
        return res.status(400).json({ message: 'Daily bonus not ready yet' });
      }
    }

    // Calculate streak
    let streak = 1;
    if (lastClaim) {
      const daysSinceLastClaim = (now - lastClaim) / (1000 * 60 * 60 * 24);
      if (daysSinceLastClaim <= 1.5) {
        streak = lastBonus.streak + 1;
      }
    }

    // Calculate bonus amount
    const vipLevel = calculateVIPLevel(user.totalBets);
    const bonusAmount = calculateDailyBonusAmount(streak, vipLevel);

    // Create bonus record
    const dailyBonus = new DailyBonus({
      userId: user._id,
      amount: bonusAmount,
      streak,
      vipLevel
    });
    await dailyBonus.save();

    // Update user balance
    user.balance += bonusAmount;
    await user.save();

    res.json({
      message: 'Daily bonus claimed successfully!',
      bonusAmount,
      newBalance: user.balance,
      streak
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Calculate daily bonus amount
const calculateDailyBonusAmount = (streak, vipLevel) => {
  const baseAmounts = [10, 20, 30, 50, 75, 100, 200];
  const dayIndex = Math.min(streak - 1, baseAmounts.length - 1);
  const baseAmount = baseAmounts[dayIndex];
  
  const vipMultipliers = {
    BRONZE: 1,
    SILVER: 1.2,
    GOLD: 1.5,
    PLATINUM: 2,
    DIAMOND: 3
  };
  
  return Math.round(baseAmount * (vipMultipliers[vipLevel] || 1));
};

// ===== REFERRAL ROUTES =====

// Get referral stats
app.get('/api/referral/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    const referrals = await Referral.find({ 
      referrer: user._id,
      status: 'active' 
    }).populate('referred', 'username createdAt totalBets');
    
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
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const betsToday = await Bet.countDocuments({ 
      createdAt: { $gte: today } 
    });
    
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activeUsers = await Bet.distinct('userId', { 
      createdAt: { $gte: lastWeek } 
    }).then(users => users.length);

    const revenue = await Bet.aggregate([
      {
        $group: {
          _id: null,
          totalBet: { $sum: '$betAmount' },
          totalWin: { $sum: '$winAmount' },
          totalCashback: { $sum: '$cashbackAmount' }
        }
      }
    ]);

    const revenueData = revenue[0] || { totalBet: 0, totalWin: 0, totalCashback: 0 };
    const netRevenue = revenueData.totalBet - revenueData.totalWin - revenueData.totalCashback;

    const vipDistribution = await User.aggregate([
      {
        $project: {
          vipLevel: {
            $cond: {
              if: { $gte: ['$totalBets', 10000] }, then: 'DIAMOND',
              else: {
                $cond: {
                  if: { $gte: ['$totalBets', 5000] }, then: 'PLATINUM',
                  else: {
                    $cond: {
                      if: { $gte: ['$totalBets', 1000] }, then: 'GOLD',
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
      revenue: netRevenue,
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

    console.log(`Admin balance update: User ${user.username} from ${oldBalance} to ${newBalance}. Reason: ${reason}`);

    res.json({
      message: 'Balance updated successfully',
      user: {
        id: user._id,
        username: user.username,
        balance: user.balance
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== CRON JOBS =====

// Reset daily bonuses (runs at midnight)
cron.schedule('0 0 * * *', async () => {
  console.log('Running daily bonus reset...');
  try {
    // Could add logic here for special events, bonus multipliers, etc.
    console.log('Daily bonus reset completed');
  } catch (error) {
    console.error('Error in daily bonus reset:', error);
  }
});

// Clean up old sessions (runs every hour)
cron.schedule('0 * * * *', async () => {
  console.log('Cleaning up old sessions...');
  try {
    // Clean up old betting sessions, expired tokens, etc.
    console.log('Session cleanup completed');
  } catch (error) {
    console.error('Error in session cleanup:', error);
  }
});

// ===== ERROR HANDLING =====

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error:', error);
  res.status(500).json({ 
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: error.message })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ===== START SERVER =====

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Server accessible at: http://0.0.0.0:${PORT}`);
});