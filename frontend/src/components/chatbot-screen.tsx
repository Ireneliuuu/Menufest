import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { ChatHistory, Screen } from '../App';
import { ArrowLeft, Send, Refrigerator, MessageSquare, User, ChefHat, Clock, Users, ExternalLink } from 'lucide-react';

interface ChatbotScreenProps {
  onNavigate: (screen: Screen) => void;
  onAddChatHistory: (chat: ChatHistory) => void;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  mealPlan?: MealPlan;
}

interface MealPlan {
  days: MealDay[];
}

interface MealDay {
  day: number;
  dayName: string;
  meals: Meal[];
}

interface Meal {
  id: string;
  name: string;
  type: 'breakfast' | 'lunch' | 'dinner';
  ingredients: string[];
  cookingTime: number;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  steps: string[];
  tips?: string;
}

interface RecipeModalProps {
  meal: Meal | null;
  isOpen: boolean;
  onClose: () => void;
}

// Recipe Modal Component
function RecipeModal({ meal, isOpen, onClose }: RecipeModalProps) {
  if (!meal) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-4 max-h-[80vh] overflow-y-auto rounded-3xl" 
                     style={{ 
                       backgroundColor: 'rgba(248, 249, 250, 0.95)', 
                       backdropFilter: 'blur(20px)',
                       border: '1px solid rgba(255, 255, 255, 0.2)',
                       fontFamily: "'Nunito', sans-serif"
                     }}>
        <DialogHeader>
          <DialogTitle className="text-xl mb-2 rounded-2xl p-3" 
                       style={{ 
                         color: 'var(--menufest-green)',
                         backgroundColor: 'rgba(255, 255, 255, 0.7)',
                         fontFamily: "'Comic Neue', cursive"
                       }}>
            {meal.name} 🍽️
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Meal Info */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="rounded-full" 
                   style={{ backgroundColor: 'rgba(255, 133, 0, 0.2)', color: 'var(--menufest-orange)' }}>
              <Clock className="w-3 h-3 mr-1" />
              {meal.cookingTime} mins
            </Badge>
            <Badge variant="secondary" className="rounded-full"
                   style={{ backgroundColor: 'rgba(27, 67, 50, 0.2)', color: 'var(--menufest-green)' }}>
              <Users className="w-3 h-3 mr-1" />
              {meal.servings} servings
            </Badge>
            <Badge variant="secondary" className="rounded-full"
                   style={{ backgroundColor: 'rgba(248, 249, 250, 0.8)', color: '#666' }}>
              {meal.difficulty}
            </Badge>
          </div>

          {/* Ingredients */}
          <div className="rounded-2xl p-4" 
               style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)' }}>
            <h3 className="font-medium mb-2" style={{ color: 'var(--menufest-green)' }}>Ingredients:</h3>
            <ul className="text-sm space-y-1">
              {meal.ingredients.map((ingredient, index) => (
                <li key={index} className="flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full mr-2" 
                        style={{ backgroundColor: 'var(--menufest-orange)' }}></span>
                  {ingredient}
                </li>
              ))}
            </ul>
          </div>

          {/* Cooking Steps */}
          <div className="rounded-2xl p-4" 
               style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)' }}>
            <h3 className="font-medium mb-2" style={{ color: 'var(--menufest-green)' }}>Cooking Steps:</h3>
            <ol className="text-sm space-y-2">
              {meal.steps.map((step, index) => (
                <li key={index} className="flex">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-3"
                        style={{ backgroundColor: 'var(--menufest-orange)', color: 'white' }}>
                    {index + 1}
                  </span>
                  <span className="flex-1">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Tips */}
          {meal.tips && (
            <div className="rounded-2xl p-4" 
                 style={{ backgroundColor: 'rgba(255, 133, 0, 0.1)' }}>
              <h3 className="font-medium mb-1" style={{ color: 'var(--menufest-orange)' }}>💡 Pro Tip:</h3>
              <p className="text-sm">{meal.tips}</p>
            </div>
          )}

          {/* External Link */}
          <Button className="w-full rounded-2xl" 
                  style={{ backgroundColor: 'var(--menufest-green)', color: 'white' }}>
            <ExternalLink className="w-4 h-4 mr-2" />
            View Full Recipe
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ChatbotScreen({ onNavigate, onAddChatHistory }: ChatbotScreenProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: '你好！我是 Menufest 的智慧菜單助手 🍽️\n\n我可以幫你：\n• 規劃每日菜單\n• 推薦食譜\n• 分析營養搭配\n\n試試輸入「幫我規劃 3 天晚餐」開始吧！',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Mock meal data with detailed recipes
  const mockMealPlans: { [key: string]: MealPlan } = {
    "3天晚餐": {
      days: [
        {
          day: 1,
          dayName: "Day 1",
          meals: [{
            id: 'dinner1',
            name: '雞胸肉沙拉 + 紫米飯 + 南瓜湯',
            type: 'dinner',
            ingredients: ['雞胸肉 200g', '混合生菜 100g', '紫米 50g', '南瓜 200g', '橄欖油', '檸檬汁', '鹽巴', '黑胡椒'],
            cookingTime: 35,
            servings: 1,
            difficulty: 'Easy',
            steps: [
              '紫米先浸泡 2 小時，然後蒸煮 25 分鐘',
              '雞胸肉用鹽巴和黑胡椒醃製 10 分鐘',
              '平底鍋刷橄欖油，中火煎雞胸肉每面 6-7 分鐘',
              '南瓜去皮切塊，加水煮 15 分鐘打成泥',
              '生菜清洗乾淨，淋上檸檬汁和橄欖油',
              '雞胸肉切片擺在沙拉上即可'
            ],
            tips: '雞胸肉不要煎太久，保持嫩度。南瓜湯可加少許肉桂粉增香。'
          }]
        },
        {
          day: 2,
          dayName: "Day 2", 
          meals: [{
            id: 'dinner2',
            name: '清蒸鱸魚 + 涼拌菠菜 + 味噌湯',
            type: 'dinner',
            ingredients: ['鱸魚 250g', '菠菜 150g', '味噌 2大匙', '薑絲', '蒜泥', '醬油', '香油', '豆腐 100g'],
            cookingTime: 25,
            servings: 1,
            difficulty: 'Medium',
            steps: [
              '鱸魚清洗乾淨，魚身劃幾刀，放上薑絲',
              '電鍋外鍋放 1 杯水，蒸 12 分鐘',
              '菠菜汆燙 30 秒，過冷水擠乾',
              '菠菜加蒜泥、醬油、香油拌勻',
              '味噌用少許熱水化開，加入豆腐丁煮 3 分鐘',
              '魚蒸好後淋醬油和香油即可'
            ],
            tips: '魚要新鮮，蒸的時間不要太久避免肉質老化。'
          }]
        },
        {
          day: 3,
          dayName: "Day 3",
          meals: [{
            id: 'dinner3', 
            name: '豆腐炒菇 + 涼拌毛豆 + 番茄蛋花湯',
            type: 'dinner',
            ingredients: ['板豆腐 200g', '綜合菇類 150g', '毛豆 100g', '雞蛋 1顆', '番茄 2顆', '蔥花', '蒜片'],
            cookingTime: 20,
            servings: 1,
            difficulty: 'Easy',
            steps: [
              '豆腐切塊，菇類洗淨切片',
              '毛豆汆燙 3 分鐘，加鹽和香油拌勻',
              '熱鍋下蒜片爆香，放入豆腐煎至微焦',
              '加入菇類炒 3 分鐘，調味起鍋',
              '番茄切丁炒出汁，加水煮開',
              '蛋液打散倒入，快速攪拌成蛋花，撒蔥花'
            ],
            tips: '豆腐先煎再炒不易碎。蛋花湯要趁熱享用最美味。'
          }]
        }
      ]
    }
  };

  // Auto scroll to bottom when new message is added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputText,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI processing and response
    setTimeout(() => {
      let aiResponse: ChatMessage;
      
      // Check if user asked for meal planning
      if (inputText.includes('晚餐') || inputText.includes('菜單') || inputText.includes('規劃')) {
        const matchedPlan = mockMealPlans["3天晚餐"];
        aiResponse = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: '這是為您準備的三天健康晚餐 🍽️',
          timestamp: new Date(),
          mealPlan: matchedPlan
        };
        
        // Add to chat history
        const newChat: ChatHistory = {
          id: Date.now().toString(),
          title: '3天晚餐菜單規劃',
          date: new Date().toISOString().split('T')[0],
          summary: '智慧推薦的健康晚餐組合'
        };
        onAddChatHistory(newChat);
      } else {
        // General response
        aiResponse = {
          id: (Date.now() + 1).toString(),
          type: 'ai', 
          content: '我來幫您解答！您可以試試問我：\n• "幫我規劃一週菜單"\n• "推薦健康晚餐"\n• "有什麼快手料理？"\n\n或者直接說出您的需求，我會為您客製化建議 😊',
          timestamp: new Date()
        };
      }
      
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleMealClick = (meal: Meal) => {
    setSelectedMeal(meal);
    setIsRecipeModalOpen(true);
  };

  return (
    <>
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Comic+Neue:wght@300;400;700&family=Nunito:wght@300;400;600;700&display=swap" rel="stylesheet" />
      
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--menufest-cream)' }}>
        {/* Header */}
        <div className="p-4 rounded-b-3xl" 
             style={{ 
               backgroundColor: 'var(--menufest-green)',
               fontFamily: "'Comic Neue', cursive"
             }}>
          <div className="flex items-center space-x-3">
            <button onClick={() => onNavigate('home')} className="rounded-full p-2 hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-6 h-6" style={{ color: 'var(--menufest-white)' }} />
            </button>
            <h1 className="text-xl flex-1" style={{ color: 'var(--menufest-white)' }}>
              智慧菜單規劃 🤖
            </h1>
          </div>
        </div>

        {/* Chat Messages */}
        <div ref={chatContainerRef} className="flex-1 p-4 pb-24 overflow-y-auto">
          <div className="max-w-md mx-auto space-y-4" style={{ fontFamily: "'Nunito', sans-serif" }}>
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-3xl p-4 ${
                  message.type === 'user' 
                    ? 'text-white' 
                    : 'text-gray-800'
                }`}
                style={{
                  backgroundColor: message.type === 'user' 
                    ? 'var(--menufest-green)' 
                    : 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: message.type === 'ai' ? 'blur(20px)' : 'none',
                  border: message.type === 'ai' ? '1px solid rgba(255, 255, 255, 0.3)' : 'none'
                }}>
                  <p className="whitespace-pre-line">{message.content}</p>
                  
                  {/* Meal Plan Display */}
                  {message.mealPlan && (
                    <div className="mt-4 space-y-3">
                      {message.mealPlan.days.map((day) => (
                        <div key={day.day} 
                             className="rounded-2xl p-3 cursor-pointer hover:scale-105 transition-transform"
                             style={{ 
                               backgroundColor: 'rgba(255, 255, 255, 0.9)',
                               border: '1px solid rgba(255, 255, 255, 0.4)'
                             }}>
                          <h3 className="font-medium mb-2" 
                              style={{ 
                                color: 'var(--menufest-green)',
                                fontFamily: "'Comic Neue', cursive"
                              }}>
                            Day {day.day}：
                          </h3>
                          {day.meals.map((meal) => (
                            <button
                              key={meal.id}
                              onClick={() => handleMealClick(meal)}
                              className="w-full text-left p-3 rounded-xl hover:scale-105 transition-all duration-200"
                              style={{ 
                                backgroundColor: 'rgba(255, 133, 0, 0.1)',
                                border: '1px solid rgba(255, 133, 0, 0.3)'
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium" style={{ color: 'var(--menufest-orange)' }}>
                                  {meal.name}
                                </span>
                                <div className="text-xs flex items-center space-x-2 text-gray-600">
                                  <span className="flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {meal.cookingTime}分
                                  </span>
                                  <span>{meal.difficulty}</span>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="rounded-3xl p-4" 
                     style={{ 
                       backgroundColor: 'rgba(255, 255, 255, 0.8)',
                       backdropFilter: 'blur(20px)',
                       border: '1px solid rgba(255, 255, 255, 0.3)'
                     }}>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--menufest-orange)' }}></div>
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--menufest-orange)', animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--menufest-orange)', animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4" 
             style={{ 
               backgroundColor: 'rgba(255, 255, 255, 0.9)',
               backdropFilter: 'blur(20px)',
               borderTop: '1px solid rgba(255, 255, 255, 0.3)',
               fontFamily: "'Nunito', sans-serif"
             }}>
          <div className="max-w-md mx-auto">
            <div className="flex items-center space-x-3 p-2 rounded-3xl"
                 style={{ 
                   backgroundColor: 'rgba(248, 249, 250, 0.8)',
                   border: '1px solid rgba(255, 255, 255, 0.4)'
                 }}>
              <Input
                type="text"
                placeholder="輸入您的需求，例如：幫我規劃 3 天晚餐"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 border-0 bg-transparent focus:ring-0 focus:outline-none rounded-3xl"
                disabled={isTyping}
              />
              <Button
                onClick={handleSendMessage}
                size="sm"
                className="rounded-full p-2"
                style={{ 
                  backgroundColor: 'var(--menufest-orange)',
                  color: 'white'
                }}
                disabled={isTyping || !inputText.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 p-4 rounded-t-3xl" 
             style={{ 
               backgroundColor: 'var(--menufest-green)',
               fontFamily: "'Comic Neue', cursive"
             }}>
          <div className="flex justify-around max-w-md mx-auto">
            <button 
              onClick={() => onNavigate('fridge')}
              className="flex flex-col items-center space-y-1 p-2 rounded-2xl hover:bg-white/10 transition-colors"
              style={{ color: 'var(--menufest-cream)' }}
            >
              <Refrigerator className="w-6 h-6" />
              <span className="text-xs">冰箱</span>
            </button>
            
            <button 
              className="flex flex-col items-center space-y-1 p-3 rounded-2xl"
              style={{ 
                backgroundColor: 'var(--menufest-orange)',
                color: 'var(--menufest-white)'
              }}
            >
              <MessageSquare className="w-6 h-6" />
              <span className="text-xs">聊天</span>
            </button>
            
            <button 
              onClick={() => onNavigate('profile')}
              className="flex flex-col items-center space-y-1 p-2 rounded-2xl hover:bg-white/10 transition-colors"
              style={{ color: 'var(--menufest-cream)' }}
            >
              <User className="w-6 h-6" />
              <span className="text-xs">個人</span>
            </button>
          </div>
        </div>

        {/* Recipe Modal */}
        <RecipeModal 
          meal={selectedMeal}
          isOpen={isRecipeModalOpen}
          onClose={() => {
            setIsRecipeModalOpen(false);
            setSelectedMeal(null);
          }}
        />
      </div>
    </>
  );
}