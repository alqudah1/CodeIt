import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import './Leaderboard.css';
import Header from '../Header/Header';

const Leaderboard = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('all_time'); // all_time, weekly_xp, streak, monthly_badges
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeaderboard(activeTab);
  }, [activeTab]);

  const fetchLeaderboard = async (type) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to view leaderboard');
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `http://localhost:8080/api/rewards/leaderboard/${type}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setLeaderboardData(response.data.leaderboard);
        
        // Find user's rank in the data
        const userRank = response.data.leaderboard.find(
          player => player.user_id === user?.id
        );
        setMyRank(userRank ? userRank.rank_position : null);
      }

    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getTabIcon = (tab) => {
    const icons = {
      all_time: '🏆',
      weekly_xp: '⚡',
      streak: '🔥',
      monthly_badges: '🎖️'
    };
    return icons[tab] || '📊';
  };

  const getTabLabel = (tab) => {
    const labels = {
      all_time: 'All Time',
      weekly_xp: 'Weekly XP',
      streak: 'Streak',
      monthly_badges: 'Badges'
    };
    return labels[tab];
  };

  const getMedalEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  const getPointsLabel = () => {
    if (activeTab === 'streak') return 'days';
    if (activeTab === 'monthly_badges') return 'badges';
    return 'XP';
  };

  return (
    <div className="leaderboard-page">
      <Header />
      
      <div className="leaderboard-container">
        {/* Hero Section */}
        <section className="leaderboard-hero">
          <h1 className="leaderboard-title">
            <span className="title-icon">🏆</span>
            Leaderboard
          </h1>
          <p className="leaderboard-subtitle">
            Compete with fellow learners and climb to the top!
          </p>
          
          {/* User's Current Rank Card */}
          {myRank && (
            <div className="my-rank-card">
              <div className="rank-badge">
                <span className="rank-label">Your Rank</span>
                <span className="rank-number">#{myRank}</span>
              </div>
              <p className="rank-message">
                {myRank <= 10 
                  ? "🌟 You're in the top 10! Keep it up!" 
                  : "Keep learning to climb higher!"}
              </p>
            </div>
          )}
        </section>

        {/* Tab Navigation */}
        <div className="leaderboard-tabs">
          {['all_time', 'weekly_xp', 'streak', 'monthly_badges'].map((tab) => (
            <button
              key={tab}
              className={`tab-button ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              <span className="tab-icon">{getTabIcon(tab)}</span>
              <span className="tab-label">{getTabLabel(tab)}</span>
            </button>
          ))}
        </div>

        {/* Leaderboard Content */}
        <div className="leaderboard-content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading rankings...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p className="error-message">{error}</p>
              <button onClick={() => fetchLeaderboard(activeTab)}>
                Try Again
              </button>
            </div>
          ) : leaderboardData.length === 0 ? (
            <div className="empty-state">
              <p className="empty-message">🎯 No rankings available yet. Start learning to get on the board!</p>
            </div>
          ) : (
            <>
              {/* Top 3 Podium */}
              {leaderboardData.length >= 3 && (
                <div className="podium-section">
                  <div className="podium">
                    {/* Second Place */}
                    <div className="podium-card second">
                      <div className="podium-rank">🥈</div>
                      <div className="podium-avatar">
                        {leaderboardData[1]?.name?.charAt(0).toUpperCase()}
                      </div>
                      <h3 className="podium-name">{leaderboardData[1]?.name}</h3>
                      <p className="podium-points">
                        {formatNumber(leaderboardData[1]?.xp_points)} {getPointsLabel()}
                      </p>
                    </div>

                    {/* First Place */}
                    <div className="podium-card first">
                      <div className="podium-rank champion">👑</div>
                      <div className="podium-avatar champion">
                        {leaderboardData[0]?.name?.charAt(0).toUpperCase()}
                      </div>
                      <h3 className="podium-name">{leaderboardData[0]?.name}</h3>
                      <p className="podium-points">
                        {formatNumber(leaderboardData[0]?.xp_points)} {getPointsLabel()}
                      </p>
                      <div className="champion-badge">Champion</div>
                    </div>

                    {/* Third Place */}
                    <div className="podium-card third">
                      <div className="podium-rank">🥉</div>
                      <div className="podium-avatar">
                        {leaderboardData[2]?.name?.charAt(0).toUpperCase()}
                      </div>
                      <h3 className="podium-name">{leaderboardData[2]?.name}</h3>
                      <p className="podium-points">
                        {formatNumber(leaderboardData[2]?.xp_points)} {getPointsLabel()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Ranking List */}
              <div className="ranking-list">
                <div className="ranking-header">
                  <span>Rank</span>
                  <span>Player</span>
                  <span>{getPointsLabel().toUpperCase()}</span>
                </div>

                {leaderboardData.map((player, index) => (
                  <div 
                    key={player.user_id} 
                    className={`ranking-row ${
                      player.user_id === user?.id ? 'current-user' : ''
                    } ${index < 3 ? 'top-three' : ''}`}
                  >
                    <div className="rank-cell">
                      <span className="rank-position">
                        {getMedalEmoji(player.rank_position)}
                      </span>
                    </div>
                    
                    <div className="player-cell">
                      <div className="player-avatar">
                        {player.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="player-info">
                        <span className="player-name">
                          {player.name}
                          {player.user_id === user?.id && (
                            <span className="you-badge">You</span>
                          )}
                        </span>
                      </div>
                    </div>
                    
                    <div className="points-cell">
                      <span className="points-value">
                        {formatNumber(player.xp_points)}
                      </span>
                      <span className="points-label">
                        {getPointsLabel()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;

