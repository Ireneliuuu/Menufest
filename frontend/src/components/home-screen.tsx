import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { UserProfile, ChatHistory, Screen } from '../App';
import { Refrigerator, MessageSquare, User, LogOut, ChefHat, Eye } from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';

interface HomeScreenProps {
  user: UserProfile | null;
  chatHistories: ChatHistory[];
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
}

export function HomeScreen({ user, chatHistories, onNavigate, onLogout }: HomeScreenProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;600;700&display=swap');
        
        .home-container * {
          font-family: 'Inter', 'Noto Sans TC', sans-serif;
        }
        
        .generate-menu-btn {
          transition: all 0.3s ease;
        }
        
        .generate-menu-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(255, 133, 0, 0.4);
        }
        
        .menu-card {
          transition: all 0.2s ease;
          cursor: pointer;
        }
        
        .menu-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
        }
      `}</style>

      <div className="home-container min-h-screen flex flex-col" style={{ backgroundColor: '#F8F9FA' }}>
        {/* Top Navbar */}
        <div 
          className="p-4 flex items-center justify-between"
          style={{ 
            backgroundColor: 'var(--menufest-green)',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--menufest-cream)' }}
            >
              <span className="text-xl">🍽️</span>
            </div>
            <h1 
              className="m-0"
              style={{ 
                color: 'var(--menufest-white)',
                fontSize: '1.5rem',
                fontWeight: '700'
              }}
            >
              Menufest
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback 
                style={{ 
                  backgroundColor: 'var(--menufest-orange)',
                  color: 'white',
                  fontWeight: '600'
                }}
              >
                {user ? getInitials(user.fullName) : 'U'}
              </AvatarFallback>
            </Avatar>
            
            <button
              onClick={onLogout}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              style={{ color: 'var(--menufest-white)' }}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 pb-24 max-w-4xl mx-auto w-full">
          {/* Main Section Card */}
          <Card 
            className="mb-8 overflow-hidden"
            style={{ 
              backgroundColor: 'var(--menufest-white)',
              borderRadius: '1.5rem',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
            }}
          >
            <CardContent className="p-8 text-center">
              <div 
                className="mx-auto mb-5 w-20 h-20 rounded-full flex items-center justify-center"
                style={{ 
                  backgroundColor: 'var(--menufest-orange)',
                  boxShadow: '0 4px 15px rgba(255, 133, 0, 0.3)'
                }}
              >
                <ChefHat className="w-10 h-10" style={{ color: 'var(--menufest-white)' }} />
              </div>
              
              <h2 
                className="mb-3 m-0"
                style={{ 
                  color: 'var(--menufest-green)',
                  fontSize: '1.75rem',
                  fontWeight: '600'
                }}
              >
                Your Smart Meal Assistant
              </h2>
              
              <p 
                className="mb-6 text-gray-600"
                style={{ fontSize: '1rem', lineHeight: '1.6' }}
              >
                Let AI create personalized menus based on your ingredients, preferences, and family needs
              </p>
              
              <Button 
                onClick={() => onNavigate('menu-generator')}
                className="generate-menu-btn px-8 py-6 rounded-xl"
                style={{ 
                  backgroundColor: 'var(--menufest-orange)',
                  color: 'white',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  boxShadow: '0 4px 15px rgba(255, 133, 0, 0.3)'
                }}
              >
                <span className="mr-2">Generate Menu</span> 🍱
              </Button>
            </CardContent>
          </Card>

          {/* Recent Menus Section */}
          <div>
            <h3 
              className="mb-4 m-0"
              style={{ 
                color: 'var(--menufest-green)',
                fontSize: '1.3rem',
                fontWeight: '600'
              }}
            >
              最近的菜單
            </h3>
            
            {chatHistories.length === 0 ? (
              <Card 
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '1rem',
                  border: '1px solid rgba(27, 67, 50, 0.1)'
                }}
              >
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500" style={{ fontSize: '1rem' }}>
                    還沒有建立菜單
                  </p>
                  <p className="text-gray-400 mt-2" style={{ fontSize: '0.9rem' }}>
                    點擊「Generate Menu」開始規劃您的餐點
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {chatHistories.map((chat) => (
                  <Card 
                    key={chat.id} 
                    className="menu-card"
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: '1rem',
                      border: '1px solid rgba(27, 67, 50, 0.1)'
                    }}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 
                            className="mb-2 m-0"
                            style={{ 
                              color: 'var(--menufest-green)',
                              fontSize: '1.1rem',
                              fontWeight: '600'
                            }}
                          >
                            {chat.title}
                          </h4>
                          <p 
                            className="text-gray-500 mb-3"
                            style={{ fontSize: '0.85rem' }}
                          >
                            {chat.date}
                          </p>
                          <p 
                            className="text-gray-600"
                            style={{ fontSize: '0.95rem', lineHeight: '1.5' }}
                          >
                            {chat.summary}
                          </p>
                        </div>
                        
                        <Button
                          onClick={() => onNavigate('chatbot')}
                          className="rounded-lg px-4"
                          style={{ 
                            backgroundColor: 'var(--menufest-green)',
                            color: 'white'
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          查看
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Navigation */}
        <div 
          className="fixed bottom-0 left-0 right-0 p-4" 
          style={{ 
            backgroundColor: 'var(--menufest-green)',
            boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div className="flex justify-around max-w-md mx-auto">
            <button 
              onClick={() => onNavigate('fridge')}
              className="flex flex-col items-center space-y-1 p-2 rounded-lg transition-all hover:bg-white/10"
              style={{ color: 'var(--menufest-cream)' }}
            >
              <Refrigerator className="w-6 h-6" />
              <span style={{ fontSize: '0.75rem' }}>冰箱</span>
            </button>
            
            <button 
              onClick={() => onNavigate('home')}
              className="flex flex-col items-center space-y-1 p-3 rounded-lg transition-all"
              style={{ 
                backgroundColor: 'var(--menufest-orange)',
                color: 'var(--menufest-white)'
              }}
            >
              <MessageSquare className="w-6 h-6" />
              <span style={{ fontSize: '0.75rem' }}>首頁</span>
            </button>
            
            <button 
              onClick={() => onNavigate('profile')}
              className="flex flex-col items-center space-y-1 p-2 rounded-lg transition-all hover:bg-white/10"
              style={{ color: 'var(--menufest-cream)' }}
            >
              <User className="w-6 h-6" />
              <span style={{ fontSize: '0.75rem' }}>個人</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
