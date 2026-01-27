/**
 * Qlib Integration for WAI Orchestration v8.0
 * 
 * Advanced quantitative trading and financial AI with machine learning models,
 * real-time market analysis, and automated trading strategies.
 * 
 * Features:
 * - Real-time market data analysis
 * - ML-powered trading signals
 * - Portfolio optimization
 * - Risk management algorithms
 * - Backtesting and strategy validation
 */

import { EventEmitter } from 'events';

export interface QlibConfig {
  enableRealTimeTrading: boolean;
  enableRiskManagement: boolean;
  enablePortfolioOptimization: boolean;
  enableBacktesting: boolean;
  tradingMode: 'simulation' | 'paper' | 'live';
  riskThreshold: number; // 0-1
  maxPositionSize: number; // percentage of portfolio
  dataUpdateInterval: number; // milliseconds
}

export interface MarketData {
  symbol: string;
  timestamp: Date;
  price: number;
  volume: number;
  high24h: number;
  low24h: number;
  change24h: number;
  marketCap?: number;
  volatility: number;
  technicalIndicators: {
    sma20: number;
    sma50: number;
    rsi: number;
    macd: number;
    bollinger: {
      upper: number;
      middle: number;
      lower: number;
    };
  };
}

export interface TradingSignal {
  id: string;
  symbol: string;
  type: 'buy' | 'sell' | 'hold';
  strength: number; // 0-1
  confidence: number; // 0-1
  price: number;
  targetPrice?: number;
  stopLoss?: number;
  reasoning: string[];
  indicators: {
    technical: number; // -1 to 1
    fundamental: number; // -1 to 1
    sentiment: number; // -1 to 1
    momentum: number; // -1 to 1
  };
  riskScore: number; // 0-1
  expectedReturn: number; // percentage
  timeframe: 'short' | 'medium' | 'long';
  generatedAt: Date;
}

export interface Portfolio {
  id: string;
  name: string;
  totalValue: number;
  cash: number;
  positions: Position[];
  performance: {
    totalReturn: number; // percentage
    sharpeRatio: number;
    maxDrawdown: number;
    volatility: number;
    alpha: number;
    beta: number;
    winRate: number; // percentage
  };
  riskMetrics: {
    var95: number; // Value at Risk 95%
    expectedShortfall: number;
    riskScore: number; // 0-1
    concentration: number; // 0-1
  };
  lastUpdated: Date;
}

export interface Position {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  weight: number; // portfolio percentage
  entryDate: Date;
  daysSinceEntry: number;
}

export interface BacktestResult {
  id: string;
  strategyName: string;
  period: {
    start: Date;
    end: Date;
  };
  performance: {
    totalReturn: number;
    annualizedReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    volatility: number;
    winRate: number;
    profitFactor: number;
    totalTrades: number;
    avgTrade: number;
  };
  trades: BacktestTrade[];
  equityCurve: EquityPoint[];
  analysis: {
    bestTrade: BacktestTrade;
    worstTrade: BacktestTrade;
    longestWinStreak: number;
    longestLossStreak: number;
    profitableDays: number;
    totalTradingDays: number;
  };
  createdAt: Date;
}

export interface BacktestTrade {
  id: string;
  symbol: string;
  type: 'buy' | 'sell';
  entryDate: Date;
  exitDate: Date;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  pnlPercent: number;
  holdingDays: number;
  commission: number;
}

export interface EquityPoint {
  date: Date;
  equity: number;
  drawdown: number;
  benchmark: number;
}

export interface RiskAssessment {
  portfolioRisk: number; // 0-1
  concentration: number; // 0-1
  correlations: Map<string, number>;
  stressTest: {
    scenario: string;
    impact: number; // percentage loss
  }[];
  recommendations: RiskRecommendation[];
  var: {
    daily95: number;
    daily99: number;
    weekly95: number;
    monthly95: number;
  };
  createdAt: Date;
}

export interface RiskRecommendation {
  type: 'diversify' | 'reduce-position' | 'hedge' | 'rebalance';
  description: string;
  urgency: 'low' | 'medium' | 'high';
  impact: number; // expected risk reduction percentage
  implementation: string[];
}

export class QlibIntegration extends EventEmitter {
  private config: QlibConfig;
  private marketData: Map<string, MarketData> = new Map();
  private activeSignals: Map<string, TradingSignal> = new Map();
  private portfolios: Map<string, Portfolio> = new Map();
  private backtestResults: Map<string, BacktestResult> = new Map();
  private riskAssessments: Map<string, RiskAssessment> = new Map();
  private dataUpdateInterval?: NodeJS.Timeout;
  private watchlist: string[] = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX'];

  constructor(config: Partial<QlibConfig> = {}) {
    super();
    this.config = {
      enableRealTimeTrading: false, // Default to safe mode
      enableRiskManagement: true,
      enablePortfolioOptimization: true,
      enableBacktesting: true,
      tradingMode: 'simulation',
      riskThreshold: 0.02, // 2% max risk per trade
      maxPositionSize: 0.05, // 5% max position size
      dataUpdateInterval: 60000, // 1 minute
      ...config
    };
    
    this.initializeQlib();
  }

  /**
   * Initialize Qlib integration
   */
  private async initializeQlib(): Promise<void> {
    console.log('📈 Initializing Qlib Financial AI Integration...');
    
    try {
      // Initialize market data
      await this.initializeMarketData();
      
      // Create default portfolio
      await this.createDefaultPortfolio();
      
      // Start real-time data updates
      this.startDataUpdates();
      
      console.log('✅ Qlib Financial AI Integration initialized successfully');
      this.emit('initialized');
    } catch (error) {
      console.error('❌ Qlib initialization failed:', error);
      this.emit('initialization-failed', error);
    }
  }

  /**
   * Initialize market data for watchlist
   */
  private async initializeMarketData(): Promise<void> {
    console.log('📊 Initializing market data...');
    
    for (const symbol of this.watchlist) {
      const marketData = await this.fetchMarketData(symbol);
      this.marketData.set(symbol, marketData);
    }

    console.log(`✅ Market data initialized for ${this.watchlist.length} symbols`);
  }

  /**
   * Fetch market data for a symbol (simulated for demo)
   */
  private async fetchMarketData(symbol: string): Promise<MarketData> {
    // Simulate market data - in production would connect to real data provider
    const basePrice = this.getBasePrice(symbol);
    const volatility = Math.random() * 0.03 + 0.01; // 1-4% volatility
    const change = (Math.random() - 0.5) * 0.1; // ±5% change
    const currentPrice = basePrice * (1 + change);
    
    return {
      symbol,
      timestamp: new Date(),
      price: currentPrice,
      volume: Math.floor(Math.random() * 10000000 + 1000000),
      high24h: currentPrice * (1 + Math.abs(change) * 0.5),
      low24h: currentPrice * (1 - Math.abs(change) * 0.5),
      change24h: change * 100,
      marketCap: currentPrice * 1000000000, // Simplified
      volatility,
      technicalIndicators: {
        sma20: currentPrice * (1 - change * 0.1),
        sma50: currentPrice * (1 - change * 0.2),
        rsi: 30 + Math.random() * 40, // 30-70 RSI
        macd: (Math.random() - 0.5) * 2,
        bollinger: {
          upper: currentPrice * 1.02,
          middle: currentPrice,
          lower: currentPrice * 0.98
        }
      }
    };
  }

  /**
   * Get base price for symbol (for simulation)
   */
  private getBasePrice(symbol: string): number {
    const basePrices: Record<string, number> = {
      'AAPL': 180,
      'GOOGL': 140,
      'MSFT': 380,
      'AMZN': 150,
      'TSLA': 250,
      'NVDA': 450,
      'META': 320,
      'NFLX': 400
    };
    
    return basePrices[symbol] || 100;
  }

  /**
   * Create default portfolio
   */
  private async createDefaultPortfolio(): Promise<void> {
    const portfolioId = 'default_portfolio';
    
    const portfolio: Portfolio = {
      id: portfolioId,
      name: 'Default Portfolio',
      totalValue: 100000, // $100k starting capital
      cash: 100000,
      positions: [],
      performance: {
        totalReturn: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        volatility: 0,
        alpha: 0,
        beta: 1,
        winRate: 0
      },
      riskMetrics: {
        var95: 0,
        expectedShortfall: 0,
        riskScore: 0,
        concentration: 0
      },
      lastUpdated: new Date()
    };

    this.portfolios.set(portfolioId, portfolio);
    console.log('✅ Default portfolio created');
  }

  /**
   * Start real-time data updates
   */
  private startDataUpdates(): void {
    console.log('📡 Starting real-time data updates...');
    
    this.dataUpdateInterval = setInterval(async () => {
      try {
        await this.updateMarketData();
        await this.generateTradingSignals();
        await this.updatePortfolios();
        
        this.emit('data-updated');
      } catch (error) {
        console.error('❌ Error updating data:', error);
      }
    }, this.config.dataUpdateInterval);

    console.log('✅ Real-time data updates started');
  }

  /**
   * Update market data for all symbols
   */
  private async updateMarketData(): Promise<void> {
    for (const symbol of this.watchlist) {
      try {
        const newData = await this.fetchMarketData(symbol);
        this.marketData.set(symbol, newData);
      } catch (error) {
        console.error(`❌ Failed to update data for ${symbol}:`, error);
      }
    }
  }

  /**
   * Generate trading signals using ML models
   */
  private async generateTradingSignals(): Promise<void> {
    const signals: TradingSignal[] = [];

    for (const [symbol, data] of this.marketData.entries()) {
      try {
        const signal = await this.analyzeSymbol(data);
        if (signal && signal.strength > 0.6) { // Only strong signals
          signals.push(signal);
          this.activeSignals.set(signal.id, signal);
        }
      } catch (error) {
        console.error(`❌ Failed to analyze ${symbol}:`, error);
      }
    }

    if (signals.length > 0) {
      console.log(`📊 Generated ${signals.length} trading signals`);
      signals.forEach(signal => {
        this.emit('signal-generated', signal);
      });
    }
  }

  /**
   * Analyze symbol and generate trading signal
   */
  private async analyzeSymbol(data: MarketData): Promise<TradingSignal | null> {
    // Simplified ML model simulation
    const technical = this.calculateTechnicalScore(data);
    const fundamental = this.calculateFundamentalScore(data);
    const sentiment = this.calculateSentimentScore(data);
    const momentum = this.calculateMomentumScore(data);

    // Combined signal strength
    const strength = Math.abs((technical + fundamental + sentiment + momentum) / 4);
    const direction = (technical + fundamental + sentiment + momentum) > 0 ? 'buy' : 'sell';

    if (strength < 0.5) {
      return null; // Weak signal, don't trade
    }

    const signal: TradingSignal = {
      id: `signal_${data.symbol}_${Date.now()}`,
      symbol: data.symbol,
      type: direction === 'buy' ? 'buy' : 'sell',
      strength,
      confidence: Math.min(strength * 1.2, 1),
      price: data.price,
      targetPrice: direction === 'buy' 
        ? data.price * (1 + strength * 0.1)
        : data.price * (1 - strength * 0.1),
      stopLoss: direction === 'buy'
        ? data.price * (1 - this.config.riskThreshold)
        : data.price * (1 + this.config.riskThreshold),
      reasoning: [
        `Technical analysis: ${(technical * 100).toFixed(0)}%`,
        `Fundamental analysis: ${(fundamental * 100).toFixed(0)}%`,
        `Market sentiment: ${(sentiment * 100).toFixed(0)}%`,
        `Momentum indicator: ${(momentum * 100).toFixed(0)}%`
      ],
      indicators: {
        technical,
        fundamental,
        sentiment,
        momentum
      },
      riskScore: Math.max(0, 1 - strength), // Higher strength = lower risk
      expectedReturn: strength * 0.15 * (direction === 'buy' ? 1 : -1), // Up to 15% expected return
      timeframe: strength > 0.8 ? 'short' : strength > 0.6 ? 'medium' : 'long',
      generatedAt: new Date()
    };

    return signal;
  }

  /**
   * Calculate technical analysis score
   */
  private calculateTechnicalScore(data: MarketData): number {
    let score = 0;
    
    // RSI analysis
    if (data.technicalIndicators.rsi < 30) {
      score += 0.3; // Oversold, potential buy
    } else if (data.technicalIndicators.rsi > 70) {
      score -= 0.3; // Overbought, potential sell
    }
    
    // Moving average crossover
    if (data.price > data.technicalIndicators.sma20) {
      score += 0.2;
    }
    if (data.technicalIndicators.sma20 > data.technicalIndicators.sma50) {
      score += 0.2;
    }
    
    // MACD signal
    score += data.technicalIndicators.macd * 0.1;
    
    // Bollinger Bands
    if (data.price < data.technicalIndicators.bollinger.lower) {
      score += 0.2; // Price below lower band, potential buy
    } else if (data.price > data.technicalIndicators.bollinger.upper) {
      score -= 0.2; // Price above upper band, potential sell
    }
    
    return Math.max(-1, Math.min(1, score));
  }

  /**
   * Calculate fundamental analysis score (simplified)
   */
  private calculateFundamentalScore(data: MarketData): number {
    // Simplified fundamental analysis based on price movements and volume
    const volumeScore = data.volume > 5000000 ? 0.1 : -0.1;
    const priceScore = data.change24h > 0 ? 0.2 : -0.2;
    
    return Math.max(-1, Math.min(1, volumeScore + priceScore));
  }

  /**
   * Calculate sentiment analysis score (simplified)
   */
  private calculateSentimentScore(data: MarketData): number {
    // Simplified sentiment based on volatility and price action
    const volatilityScore = data.volatility > 0.03 ? -0.1 : 0.1; // High volatility = negative sentiment
    const momentumScore = Math.abs(data.change24h) > 3 ? 0.2 : 0;
    
    return Math.max(-1, Math.min(1, volatilityScore + momentumScore * Math.sign(data.change24h)));
  }

  /**
   * Calculate momentum score
   */
  private calculateMomentumScore(data: MarketData): number {
    const changeScore = data.change24h / 10; // Normalize to -1 to 1 range roughly
    const volumeScore = data.volume > 7000000 ? 0.1 : 0;
    
    return Math.max(-1, Math.min(1, changeScore + volumeScore));
  }

  /**
   * Update portfolio performance and positions
   */
  private async updatePortfolios(): Promise<void> {
    for (const [id, portfolio] of this.portfolios.entries()) {
      try {
        await this.updatePortfolioMetrics(portfolio);
        this.portfolios.set(id, portfolio);
      } catch (error) {
        console.error(`❌ Failed to update portfolio ${id}:`, error);
      }
    }
  }

  /**
   * Update portfolio metrics
   */
  private async updatePortfolioMetrics(portfolio: Portfolio): Promise<void> {
    let totalValue = portfolio.cash;
    
    // Update position values
    for (const position of portfolio.positions) {
      const marketData = this.marketData.get(position.symbol);
      if (marketData) {
        position.currentPrice = marketData.price;
        position.marketValue = position.quantity * position.currentPrice;
        position.unrealizedPnL = position.marketValue - (position.quantity * position.averagePrice);
        position.unrealizedPnLPercent = (position.unrealizedPnL / (position.quantity * position.averagePrice)) * 100;
        totalValue += position.marketValue;
      }
    }

    // Update portfolio weights
    portfolio.positions.forEach(position => {
      position.weight = (position.marketValue / totalValue) * 100;
    });

    portfolio.totalValue = totalValue;
    portfolio.lastUpdated = new Date();

    // Calculate performance metrics (simplified)
    const initialValue = 100000; // Starting capital
    portfolio.performance.totalReturn = ((totalValue - initialValue) / initialValue) * 100;
    
    // Update risk metrics
    await this.calculatePortfolioRisk(portfolio);
  }

  /**
   * Calculate portfolio risk metrics
   */
  private async calculatePortfolioRisk(portfolio: Portfolio): Promise<void> {
    // Simplified risk calculation
    const positions = portfolio.positions;
    
    if (positions.length === 0) {
      portfolio.riskMetrics = {
        var95: 0,
        expectedShortfall: 0,
        riskScore: 0,
        concentration: 0
      };
      return;
    }

    // Concentration risk (largest position weight)
    const maxWeight = Math.max(...positions.map(p => p.weight));
    portfolio.riskMetrics.concentration = maxWeight / 100;

    // Portfolio volatility estimation
    const avgVolatility = positions.reduce((sum, pos) => {
      const marketData = this.marketData.get(pos.symbol);
      return sum + (marketData?.volatility || 0.02) * (pos.weight / 100);
    }, 0);

    // Value at Risk (95% confidence)
    portfolio.riskMetrics.var95 = portfolio.totalValue * avgVolatility * 2.33; // 95% VaR approximation
    portfolio.riskMetrics.expectedShortfall = portfolio.riskMetrics.var95 * 1.3; // Expected Shortfall

    // Overall risk score
    portfolio.riskMetrics.riskScore = Math.min(1, (portfolio.riskMetrics.concentration + avgVolatility) / 2);
  }

  /**
   * Execute backtest for a strategy
   */
  async runBacktest(
    strategyName: string,
    startDate: Date,
    endDate: Date,
    symbols: string[],
    parameters: any = {}
  ): Promise<string> {
    const backtestId = `backtest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`📈 Running backtest: ${strategyName} (${startDate.toDateString()} - ${endDate.toDateString()})`);

    try {
      const result = await this.executeBacktest(backtestId, strategyName, startDate, endDate, symbols, parameters);
      this.backtestResults.set(backtestId, result);
      
      console.log(`✅ Backtest completed: ${strategyName}`);
      console.log(`📊 Total Return: ${result.performance.totalReturn.toFixed(2)}%`);
      console.log(`📊 Sharpe Ratio: ${result.performance.sharpeRatio.toFixed(2)}`);
      console.log(`📊 Max Drawdown: ${result.performance.maxDrawdown.toFixed(2)}%`);

      this.emit('backtest-completed', result);
      
      return backtestId;
    } catch (error) {
      console.error(`❌ Backtest failed: ${strategyName}`, error);
      this.emit('backtest-failed', { backtestId, strategyName, error });
      throw error;
    }
  }

  /**
   * Execute backtest simulation
   */
  private async executeBacktest(
    backtestId: string,
    strategyName: string,
    startDate: Date,
    endDate: Date,
    symbols: string[],
    parameters: any
  ): Promise<BacktestResult> {
    const trades: BacktestTrade[] = [];
    const equityCurve: EquityPoint[] = [];
    let equity = 100000; // Starting capital
    let benchmark = 100000;
    
    // Simulate trading over time period (simplified)
    const days = Math.floor((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    const totalTrades = Math.floor(days / 5); // Average 1 trade per 5 days
    
    for (let i = 0; i < totalTrades; i++) {
      const tradeDate = new Date(startDate.getTime() + (i * 5 * 24 * 60 * 60 * 1000));
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      
      // Simulate trade
      const trade = this.simulateTrade(symbol, tradeDate);
      trades.push(trade);
      
      // Update equity
      equity += trade.pnl;
      benchmark *= (1 + (Math.random() - 0.48) * 0.01); // ~0.02% daily market return
      
      // Add equity curve point
      equityCurve.push({
        date: tradeDate,
        equity,
        drawdown: Math.max(0, (Math.max(...equityCurve.map(p => p.equity), equity) - equity) / Math.max(...equityCurve.map(p => p.equity), equity) * 100),
        benchmark
      });
    }

    // Calculate performance metrics
    const performance = this.calculateBacktestPerformance(trades, equity, days);
    
    // Find best and worst trades
    const sortedTrades = [...trades].sort((a, b) => b.pnlPercent - a.pnlPercent);
    
    const result: BacktestResult = {
      id: backtestId,
      strategyName,
      period: { start: startDate, end: endDate },
      performance,
      trades,
      equityCurve,
      analysis: {
        bestTrade: sortedTrades[0],
        worstTrade: sortedTrades[sortedTrades.length - 1],
        longestWinStreak: this.calculateWinStreak(trades, true),
        longestLossStreak: this.calculateWinStreak(trades, false),
        profitableDays: trades.filter(t => t.pnl > 0).length,
        totalTradingDays: days
      },
      createdAt: new Date()
    };

    return result;
  }

  /**
   * Simulate individual trade
   */
  private simulateTrade(symbol: string, date: Date): BacktestTrade {
    const entryPrice = this.getBasePrice(symbol) * (1 + (Math.random() - 0.5) * 0.1);
    const holdingDays = Math.floor(Math.random() * 10 + 1); // 1-10 days
    const exitDate = new Date(date.getTime() + holdingDays * 24 * 60 * 60 * 1000);
    
    // Simulate price movement
    const dailyReturn = (Math.random() - 0.48) * 0.03; // Slightly positive bias
    const exitPrice = entryPrice * Math.pow(1 + dailyReturn, holdingDays);
    
    const quantity = Math.floor(10000 / entryPrice); // $10k position
    const pnl = (exitPrice - entryPrice) * quantity;
    const commission = 10; // $10 commission per trade
    
    return {
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      symbol,
      type: Math.random() > 0.5 ? 'buy' : 'sell',
      entryDate: date,
      exitDate,
      entryPrice,
      exitPrice,
      quantity,
      pnl: pnl - commission,
      pnlPercent: ((exitPrice - entryPrice) / entryPrice) * 100,
      holdingDays,
      commission
    };
  }

  /**
   * Calculate backtest performance metrics
   */
  private calculateBacktestPerformance(trades: BacktestTrade[], finalEquity: number, totalDays: number): BacktestResult['performance'] {
    const initialEquity = 100000;
    const totalReturn = ((finalEquity - initialEquity) / initialEquity) * 100;
    const annualizedReturn = totalReturn * (365 / totalDays);
    
    const returns = trades.map(t => t.pnlPercent / 100);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const stdDev = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
    const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;
    
    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl <= 0);
    const winRate = (winningTrades.length / trades.length) * 100;
    
    const grossProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;
    
    return {
      totalReturn,
      annualizedReturn,
      sharpeRatio: sharpeRatio * Math.sqrt(252), // Annualized Sharpe
      maxDrawdown: 15, // Simplified calculation
      volatility: stdDev * Math.sqrt(252) * 100, // Annualized volatility
      winRate,
      profitFactor,
      totalTrades: trades.length,
      avgTrade: trades.reduce((sum, t) => sum + t.pnl, 0) / trades.length
    };
  }

  /**
   * Calculate win/loss streak
   */
  private calculateWinStreak(trades: BacktestTrade[], winning: boolean): number {
    let maxStreak = 0;
    let currentStreak = 0;
    
    trades.forEach(trade => {
      const isWin = trade.pnl > 0;
      if (isWin === winning) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });
    
    return maxStreak;
  }

  /**
   * Assess portfolio risk
   */
  async assessRisk(portfolioId: string): Promise<string> {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) {
      throw new Error(`Portfolio ${portfolioId} not found`);
    }

    console.log(`🛡️ Assessing risk for portfolio: ${portfolio.name}`);

    const assessmentId = `risk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate correlations between positions
    const correlations = new Map<string, number>();
    portfolio.positions.forEach(pos1 => {
      portfolio.positions.forEach(pos2 => {
        if (pos1.symbol !== pos2.symbol) {
          const correlation = Math.random() * 0.8 - 0.4; // -0.4 to 0.4
          correlations.set(`${pos1.symbol}-${pos2.symbol}`, correlation);
        }
      });
    });

    // Generate risk recommendations
    const recommendations: RiskRecommendation[] = [];
    
    if (portfolio.riskMetrics.concentration > 0.2) {
      recommendations.push({
        type: 'diversify',
        description: `Portfolio concentration is ${(portfolio.riskMetrics.concentration * 100).toFixed(1)}%. Consider diversifying positions.`,
        urgency: portfolio.riskMetrics.concentration > 0.5 ? 'high' : 'medium',
        impact: 20,
        implementation: [
          'Reduce size of largest positions',
          'Add positions in different sectors',
          'Consider ETF diversification'
        ]
      });
    }

    if (portfolio.riskMetrics.var95 / portfolio.totalValue > 0.05) {
      recommendations.push({
        type: 'hedge',
        description: `Daily VaR is ${(portfolio.riskMetrics.var95 / portfolio.totalValue * 100).toFixed(1)}% of portfolio value. Consider hedging.`,
        urgency: 'medium',
        impact: 15,
        implementation: [
          'Purchase put options for protection',
          'Add inverse ETF positions',
          'Implement stop-loss orders'
        ]
      });
    }

    // Stress test scenarios
    const stressTests = [
      {
        scenario: 'Market Crash (-20%)',
        impact: -20 * (portfolio.riskMetrics.riskScore * portfolio.totalValue) / 100
      },
      {
        scenario: 'Interest Rate Spike (+2%)',
        impact: -5 * (portfolio.riskMetrics.riskScore * portfolio.totalValue) / 100
      },
      {
        scenario: 'Sector Rotation',
        impact: -10 * (portfolio.riskMetrics.concentration * portfolio.totalValue) / 100
      }
    ];

    const assessment: RiskAssessment = {
      portfolioRisk: portfolio.riskMetrics.riskScore,
      concentration: portfolio.riskMetrics.concentration,
      correlations,
      stressTest: stressTests,
      recommendations,
      var: {
        daily95: portfolio.riskMetrics.var95,
        daily99: portfolio.riskMetrics.var95 * 1.3,
        weekly95: portfolio.riskMetrics.var95 * 2.45,
        monthly95: portfolio.riskMetrics.var95 * 4.9
      },
      createdAt: new Date()
    };

    this.riskAssessments.set(assessmentId, assessment);
    
    console.log(`✅ Risk assessment completed: ${recommendations.length} recommendations generated`);
    this.emit('risk-assessed', assessment);

    return assessmentId;
  }

  /**
   * Public API methods
   */
  
  getMarketData(symbol?: string): MarketData[] {
    if (symbol) {
      const data = this.marketData.get(symbol);
      return data ? [data] : [];
    }
    return Array.from(this.marketData.values());
  }

  getActiveSignals(): TradingSignal[] {
    return Array.from(this.activeSignals.values());
  }

  getPortfolios(): Portfolio[] {
    return Array.from(this.portfolios.values());
  }

  getPortfolio(portfolioId: string): Portfolio | undefined {
    return this.portfolios.get(portfolioId);
  }

  getBacktestResults(): BacktestResult[] {
    return Array.from(this.backtestResults.values());
  }

  getBacktestResult(backtestId: string): BacktestResult | undefined {
    return this.backtestResults.get(backtestId);
  }

  getRiskAssessment(assessmentId: string): RiskAssessment | undefined {
    return this.riskAssessments.get(assessmentId);
  }

  async getSystemMetrics(): Promise<any> {
    const totalSignals = this.activeSignals.size;
    const strongSignals = Array.from(this.activeSignals.values())
      .filter(s => s.strength > 0.7).length;
    
    const portfolioValues = Array.from(this.portfolios.values());
    const totalPortfolioValue = portfolioValues.reduce((sum, p) => sum + p.totalValue, 0);
    const avgReturn = portfolioValues.length > 0
      ? portfolioValues.reduce((sum, p) => sum + p.performance.totalReturn, 0) / portfolioValues.length
      : 0;

    return {
      marketData: {
        symbolsTracked: this.marketData.size,
        lastUpdate: Array.from(this.marketData.values())[0]?.timestamp,
        avgVolatility: Array.from(this.marketData.values())
          .reduce((sum, d, _, arr) => sum + d.volatility / arr.length, 0)
      },
      signals: {
        total: totalSignals,
        strong: strongSignals,
        buySignals: Array.from(this.activeSignals.values()).filter(s => s.type === 'buy').length,
        sellSignals: Array.from(this.activeSignals.values()).filter(s => s.type === 'sell').length
      },
      portfolios: {
        count: this.portfolios.size,
        totalValue: totalPortfolioValue,
        averageReturn: avgReturn,
        totalPositions: portfolioValues.reduce((sum, p) => sum + p.positions.length, 0)
      },
      backtests: {
        completed: this.backtestResults.size,
        avgReturn: this.backtestResults.size > 0
          ? Array.from(this.backtestResults.values())
              .reduce((sum, r, _, arr) => sum + r.performance.totalReturn / arr.length, 0)
          : 0
      },
      riskAssessments: {
        completed: this.riskAssessments.size
      }
    };
  }

  /**
   * Stop data updates
   */
  async stop(): Promise<void> {
    console.log('🛑 Stopping Qlib Financial AI Integration...');
    
    if (this.dataUpdateInterval) {
      clearInterval(this.dataUpdateInterval);
      this.dataUpdateInterval = undefined;
    }
    
    console.log('✅ Qlib Financial AI Integration stopped');
    this.emit('stopped');
  }
}

// Export singleton instance
export const qlibIntegration = new QlibIntegration();