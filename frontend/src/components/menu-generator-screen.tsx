import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { ChatHistory, Screen } from '../App';
import { ArrowLeft, Send, Loader2, ChefHat, X as XIcon, Star, Check } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { Toaster } from './ui/sonner';

import { createFeedback } from "@/api/feedback";

interface MenuGeneratorScreenProps {
  onNavigate: (screen: Screen) => void;
  onAddChatHistory: (chat: ChatHistory) => void;
}

type QuestionStep = 'days' | 'meals' | 'family' | 'appliances' | 'generating' | 'complete';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  options?: {
    type: 'radio' | 'checkbox';
    choices: string[];
    selected?: string | string[];
  };
}

interface GeneratedMeal {
  day: number;
  meal: string;
  name: string;
  ingredients: string[];
  steps: string[];
  cookingTime: string;
}

export function MenuGeneratorScreen({ onNavigate, onAddChatHistory }: MenuGeneratorScreenProps) {
  const [step, setStep] = useState<QuestionStep>('days');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '你好！我是 Menufest 智能助手 🍽️\n\n讓我幫你規劃專屬的餐點菜單！首先，請問你想規劃幾天的菜單呢？',
      options: {
        type: 'radio',
        choices: ['1 天', '3 天', '5 天', '7 天']
      }
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [selectedDays, setSelectedDays] = useState('');
  const [selectedMeals, setSelectedMeals] = useState<string[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<string[]>([]);
  const [selectedAppliances, setSelectedAppliances] = useState<string[]>([]);
  const [generatedMenu, setGeneratedMenu] = useState<GeneratedMeal[]>([]);
  const [selectedMealDetail, setSelectedMealDetail] = useState<GeneratedMeal | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Feedback modal states ---------------------------------------
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [attachChat, setAttachChat] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const familyMembers = ['爸爸', '媽媽', '哥哥', '姐姐', '弟弟', '妹妹', '爺爺', '奶奶'];
  const appliances = ['瓦斯爐', '氣炸鍋', '烤箱', '微波爐', '電鍋', '壓力鍋', '慢煮鍋'];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getProgressText = () => {
    const steps: Record<QuestionStep, string> = {
      'days': '1/4',
      'meals': '2/4',
      'family': '3/4',
      'appliances': '4/4',
      'generating': '完成',
      'complete': '完成'
    };
    return steps[step];
  };

  const handleDaysSelection = (value: string) => {
    setSelectedDays(value);
    
    setMessages(prev => [
      ...prev,
      { role: 'user', content: value },
      {
        role: 'assistant',
        content: '太好了！接下來，請選擇你想規劃的餐次：',
        options: {
          type: 'checkbox',
          choices: ['早餐', '午餐', '晚餐', '宵夜']
        }
      }
    ]);
    setStep('meals');
  };

  const handleMealsSelection = () => {
    if (selectedMeals.length === 0) return;
    
    setMessages(prev => [
      ...prev,
      { role: 'user', content: selectedMeals.join('、') },
      {
        role: 'assistant',
        content: '了解！請選擇這份菜單要為哪些家庭成員準備：',
        options: {
          type: 'checkbox',
          choices: familyMembers
        }
      }
    ]);
    setStep('family');
  };

  const handleFamilySelection = () => {
    if (selectedFamily.length === 0) return;
    
    setMessages(prev => [
      ...prev,
      { role: 'user', content: selectedFamily.join('、') },
      {
        role: 'assistant',
        content: '最後一個問題！請選擇你可以使用的廚具：',
        options: {
          type: 'checkbox',
          choices: appliances
        }
      }
    ]);
    setStep('appliances');
  };

  const handleAppliancesSelection = () => {
    if (selectedAppliances.length === 0) return;
    
    setMessages(prev => [
      ...prev,
      { role: 'user', content: selectedAppliances.join('、') },
      {
        role: 'assistant',
        content: '太棒了！正在為你生成專屬菜單... 🍳'
      }
    ]);
    setStep('generating');
    
    // Simulate menu generation
    setTimeout(() => {
      generateMenu();
    }, 2000);
  };

  const generateMenu = () => {
    const days = parseInt(selectedDays.split(' ')[0]);
    const meals: GeneratedMeal[] = [];
    
    const mealNames: Record<string, string[]> = {
      '早餐': ['香煎法式吐司', '蔬菜蛋餅', '鮭魚酪梨三明治', '燕麥水果優格碗'],
      '午餐': ['照燒雞腿飯', '番茄牛肉麵', '泰式打拋豬', '清炒時蔬義大利麵'],
      '晚餐': ['香煎鮭魚佐檸檬奶油醬', '紅燒牛腩', '蒜香奶油蝦義大利麵', '日式親子丼'],
      '宵夜': ['起司薯條', '雞蛋三明治', '海鮮粥', '蔬菜湯']
    };

    for (let day = 1; day <= days; day++) {
      selectedMeals.forEach((meal, idx) => {
        const mealOptions = mealNames[meal] || ['美味料理'];
        const mealName = mealOptions[Math.floor(Math.random() * mealOptions.length)];
        
        meals.push({
          day,
          meal,
          name: mealName,
          ingredients: [
            '主要食材 200g',
            '蔬菜類 150g',
            '調味料適量',
            '油 1大匙'
          ],
          steps: [
            '準備所有食材，清洗並切好',
            '將主要食材調味醃製 10 分鐘',
            '熱鍋後加油，放入主要食材煎煮',
            '加入蔬菜拌炒均勻',
            '最後調味即可上桌'
          ],
          cookingTime: '25 分鐘'
        });
      });
    }

    setGeneratedMenu(meals);
    setMessages(prev => [
      ...prev.slice(0, -1),
      {
        role: 'assistant',
        content: `✨ 你的 ${selectedDays} 專屬菜單已經準備好了！\n\n我為你規劃了 ${meals.length} 道料理，點擊下方的餐點卡片查看詳細食譜。`
      }
    ]);
    setStep('complete');
  };

  const handleSaveMenu = () => {
    const newChat: ChatHistory = {
      id: Date.now().toString(),
      title: `${selectedDays}家庭菜單`,
      date: new Date().toLocaleDateString('zh-TW'),
      summary: `為 ${selectedFamily.join('、')} 規劃的 ${selectedMeals.join('、')} 菜單，共 ${generatedMenu.length} 道料理`
    };
    
    onAddChatHistory(newChat);
    onNavigate('home');
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    setMessages(prev => [
      ...prev,
      { role: 'user', content: inputValue },
      { 
        role: 'assistant', 
        content: '謝謝你的補充！我會根據你的需求調整菜單建議。'
      }
    ]);
    setInputValue('');
  };

  // FFEDBACK ------------------------------------------------------
  const handleEndChat = () => {
    setShowFeedbackModal(true);
  };

  // const handleSubmitFeedback = async () => {
  //   setIsSubmitting(true);
    
  //   // Simulate API call
  //   await new Promise(resolve => setTimeout(resolve, 1500));
    
  //   // Mock API call to backend
  //   const feedbackData = {
  //     raw_text: feedbackText,
  //     rating: rating,
  //     chat_id: attachChat ? Date.now().toString() : null,
  //     menu_id: attachChat ? `${selectedDays}-menu` : null
  //   };
    
  //   console.log('Feedback submitted:', feedbackData);
    
  //   setIsSubmitting(false);
  //   setFeedbackSubmitted(true);
  // };

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) {
      toast.error("請先輸入回饋內容 🙏");
      return;
    }

    setIsSubmitting(true);
    try {
      // send to backend
      await createFeedback(feedbackText.trim());

      setFeedbackSubmitted(true);
      toast.success("回饋已送出，感謝你 ❤️");
    } catch (err: any) {
      console.error("Failed to submit feedback:", err);
      toast.error(err?.response?.data?.error || "回饋送出失敗，請稍後再試");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipFeedback = () => {
    toast.info('您已跳過回饋');
    setShowFeedbackModal(false);
    onNavigate('home');
  };

  const handleCloseFeedback = () => {
    setShowFeedbackModal(false);
    setFeedbackSubmitted(false);
    setRating(0);
    setFeedbackText('');
    setAttachChat(true);
    onNavigate('home');
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;600;700&display=swap');
        
        .menu-gen-container {
          font-family: 'Inter', 'Noto Sans TC', sans-serif;
        }
        
        .menu-gen-container h1, .menu-gen-container h2, .menu-gen-container h3 {
          font-family: 'Inter', 'Noto Sans TC', sans-serif;
        }
        
        .chat-bubble {
          animation: slideIn 0.3s ease-out;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .meal-card {
          transition: all 0.2s ease;
          cursor: pointer;
        }
        
        .meal-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }

        .feedback-modal-overlay {
          animation: fadeIn 0.2s ease-out;
        }

        .feedback-modal-content {
          animation: scaleIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .star-rating {
          transition: all 0.2s ease;
        }

        .star-rating:hover {
          transform: scale(1.1);
        }
      `}</style>

      <Toaster position="top-center" />

      <div className="menu-gen-container min-h-screen flex flex-col" style={{ backgroundColor: '#F5F3EF' }}>
        {/* Header */}
        <div 
          className="p-4 flex items-center justify-between"
          style={{ 
            backgroundColor: 'var(--menufest-green)',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
          }}
        >
          <button
            onClick={() => onNavigate('home')}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            style={{ color: 'var(--menufest-white)' }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <h1 
            className="m-0"
            style={{ 
              color: 'var(--menufest-white)',
              fontSize: '1.3rem',
              fontWeight: '700'
            }}
          >
            {selectedDays ? `${selectedDays}家庭菜單對話` : '菜單生成器'}
          </h1>
          
          <button
            onClick={handleEndChat}
            className="px-4 py-1.5 rounded-full hover:opacity-80 transition-all"
            style={{ 
              backgroundColor: '#DC2626',
              color: 'white',
              fontSize: '0.85rem',
              fontWeight: '600'
            }}
          >
            結束對話
          </button>
        </div>

        {/* Chat Area */}
        <div 
          ref={scrollRef}
          className="flex-1 p-4 overflow-y-auto"
          style={{ maxHeight: 'calc(100vh - 180px)' }}
        >
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className="chat-bubble">
                {/* Message Bubble */}
                <div 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className="max-w-[80%] p-4 rounded-2xl"
                    style={
                      msg.role === 'user'
                        ? {
                            backgroundColor: 'var(--menufest-green)',
                            color: 'white',
                            borderBottomRightRadius: '0.25rem'
                          }
                        : {
                            backgroundColor: 'white',
                            border: '2px solid var(--menufest-green)',
                            color: '#333',
                            borderBottomLeftRadius: '0.25rem'
                          }
                    }
                  >
                    <p className="m-0 whitespace-pre-wrap" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                      {msg.content}
                    </p>
                  </div>
                </div>

                {/* Options */}
                {msg.options && msg.role === 'assistant' && (
                  <div className="mt-3 ml-4">
                    {msg.options.type === 'radio' && step === 'days' && (
                      <RadioGroup value={selectedDays} onValueChange={handleDaysSelection}>
                        <div className="grid grid-cols-2 gap-3">
                          {msg.options.choices.map((choice) => (
                            <div 
                              key={choice}
                              className="flex items-center space-x-2 p-3 rounded-lg cursor-pointer"
                              style={{ 
                                backgroundColor: selectedDays === choice ? 'var(--menufest-cream)' : 'white',
                                border: selectedDays === choice ? '2px solid var(--menufest-orange)' : '2px solid #E0E0E0'
                              }}
                              onClick={() => handleDaysSelection(choice)}
                            >
                              <RadioGroupItem value={choice} id={choice} />
                              <Label htmlFor={choice} className="cursor-pointer" style={{ fontSize: '0.95rem' }}>
                                {choice}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    )}

                    {msg.options.type === 'checkbox' && step === 'meals' && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-3">
                          {msg.options.choices.map((choice) => (
                            <div 
                              key={choice}
                              className="flex items-center space-x-2 p-3 rounded-lg cursor-pointer"
                              style={{ 
                                backgroundColor: selectedMeals.includes(choice) ? 'var(--menufest-cream)' : 'white',
                                border: selectedMeals.includes(choice) ? '2px solid var(--menufest-orange)' : '2px solid #E0E0E0'
                              }}
                              onClick={() => {
                                setSelectedMeals(prev =>
                                  prev.includes(choice)
                                    ? prev.filter(m => m !== choice)
                                    : [...prev, choice]
                                );
                              }}
                            >
                              <Checkbox 
                                id={choice}
                                checked={selectedMeals.includes(choice)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedMeals(prev => [...prev, choice]);
                                  } else {
                                    setSelectedMeals(prev => prev.filter(m => m !== choice));
                                  }
                                }}
                              />
                              <Label htmlFor={choice} className="cursor-pointer" style={{ fontSize: '0.95rem' }}>
                                {choice}
                              </Label>
                            </div>
                          ))}
                        </div>
                        <Button 
                          onClick={handleMealsSelection}
                          disabled={selectedMeals.length === 0}
                          className="w-full mt-3 rounded-lg"
                          style={{ 
                            backgroundColor: 'var(--menufest-orange)',
                            color: 'white'
                          }}
                        >
                          確認選擇
                        </Button>
                      </div>
                    )}

                    {msg.options.type === 'checkbox' && step === 'family' && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-3">
                          {msg.options.choices.map((choice) => (
                            <div 
                              key={choice}
                              className="flex items-center space-x-2 p-3 rounded-lg cursor-pointer"
                              style={{ 
                                backgroundColor: selectedFamily.includes(choice) ? 'var(--menufest-cream)' : 'white',
                                border: selectedFamily.includes(choice) ? '2px solid var(--menufest-orange)' : '2px solid #E0E0E0'
                              }}
                              onClick={() => {
                                setSelectedFamily(prev =>
                                  prev.includes(choice)
                                    ? prev.filter(m => m !== choice)
                                    : [...prev, choice]
                                );
                              }}
                            >
                              <Checkbox 
                                id={choice}
                                checked={selectedFamily.includes(choice)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedFamily(prev => [...prev, choice]);
                                  } else {
                                    setSelectedFamily(prev => prev.filter(m => m !== choice));
                                  }
                                }}
                              />
                              <Label htmlFor={choice} className="cursor-pointer" style={{ fontSize: '0.95rem' }}>
                                {choice}
                              </Label>
                            </div>
                          ))}
                        </div>
                        <Button 
                          onClick={handleFamilySelection}
                          disabled={selectedFamily.length === 0}
                          className="w-full mt-3 rounded-lg"
                          style={{ 
                            backgroundColor: 'var(--menufest-orange)',
                            color: 'white'
                          }}
                        >
                          確認選擇
                        </Button>
                      </div>
                    )}

                    {msg.options.type === 'checkbox' && step === 'appliances' && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-3">
                          {msg.options.choices.map((choice) => (
                            <div 
                              key={choice}
                              className="flex items-center space-x-2 p-3 rounded-lg cursor-pointer"
                              style={{ 
                                backgroundColor: selectedAppliances.includes(choice) ? 'var(--menufest-cream)' : 'white',
                                border: selectedAppliances.includes(choice) ? '2px solid var(--menufest-orange)' : '2px solid #E0E0E0'
                              }}
                              onClick={() => {
                                setSelectedAppliances(prev =>
                                  prev.includes(choice)
                                    ? prev.filter(m => m !== choice)
                                    : [...prev, choice]
                                );
                              }}
                            >
                              <Checkbox 
                                id={choice}
                                checked={selectedAppliances.includes(choice)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedAppliances(prev => [...prev, choice]);
                                  } else {
                                    setSelectedAppliances(prev => prev.filter(m => m !== choice));
                                  }
                                }}
                              />
                              <Label htmlFor={choice} className="cursor-pointer" style={{ fontSize: '0.95rem' }}>
                                {choice}
                              </Label>
                            </div>
                          ))}
                        </div>
                        <Button 
                          onClick={handleAppliancesSelection}
                          disabled={selectedAppliances.length === 0}
                          className="w-full mt-3 rounded-lg"
                          style={{ 
                            backgroundColor: 'var(--menufest-orange)',
                            color: 'white'
                          }}
                        >
                          開始生成菜單
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Loading State */}
            {step === 'generating' && (
              <div className="flex justify-center items-center py-8">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin mx-auto mb-3" style={{ color: 'var(--menufest-orange)' }} />
                  <p style={{ color: 'var(--menufest-green)', fontSize: '1.1rem' }}>
                    正在烹飪你的菜單... 🍳
                  </p>
                </div>
              </div>
            )}

            {/* Generated Menu */}
            {step === 'complete' && generatedMenu.length > 0 && (
              <div className="space-y-4 mt-4">
                {Array.from(new Set(generatedMenu.map(m => m.day))).map(day => (
                  <div key={day}>
                    <h3 
                      className="mb-3 m-0"
                      style={{ 
                        color: 'var(--menufest-green)',
                        fontSize: '1.2rem',
                        fontWeight: '700'
                      }}
                    >
                      第 {day} 天
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {generatedMenu.filter(m => m.day === day).map((meal, idx) => (
                        <Card 
                          key={idx}
                          className="meal-card"
                          onClick={() => setSelectedMealDetail(meal)}
                          style={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '1rem',
                            border: '2px solid var(--menufest-green)'
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <span 
                                className="px-3 py-1 rounded-full"
                                style={{ 
                                  backgroundColor: 'var(--menufest-orange)',
                                  color: 'white',
                                  fontSize: '0.8rem',
                                  fontWeight: '600'
                                }}
                              >
                                {meal.meal}
                              </span>
                              <ChefHat className="w-5 h-5" style={{ color: 'var(--menufest-green)' }} />
                            </div>
                            <h4 
                              className="mb-2 m-0"
                              style={{ 
                                color: 'var(--menufest-green)',
                                fontSize: '1.1rem',
                                fontWeight: '600'
                              }}
                            >
                              {meal.name}
                            </h4>
                            <p className="text-gray-600 m-0" style={{ fontSize: '0.85rem' }}>
                              烹飪時間：{meal.cookingTime}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6">
                  <Button 
                    onClick={handleSaveMenu}
                    className="flex-1 rounded-lg py-6"
                    style={{ 
                      backgroundColor: 'var(--menufest-green)',
                      color: 'white',
                      fontSize: '1rem',
                      fontWeight: '600'
                    }}
                  >
                    儲存菜單
                  </Button>
                  <Button 
                    onClick={() => {
                      setStep('days');
                      setMessages([messages[0]]);
                      setSelectedDays('');
                      setSelectedMeals([]);
                      setSelectedFamily([]);
                      setSelectedAppliances([]);
                      setGeneratedMenu([]);
                    }}
                    className="flex-1 rounded-lg py-6"
                    style={{ 
                      backgroundColor: 'var(--menufest-orange)',
                      color: 'white',
                      fontSize: '1rem',
                      fontWeight: '600'
                    }}
                  >
                    重新生成
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        {step !== 'generating' && !showFeedbackModal && (
          <div 
            className="p-4 border-t"
            style={{ 
              backgroundColor: 'white',
              borderTop: '1px solid #E0E0E0',
              transition: 'opacity 0.3s ease'
            }}
          >
            <div className="max-w-3xl mx-auto flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="輸入訊息或補充需求..."
                className="flex-1 rounded-xl"
                style={{ 
                  backgroundColor: '#F5F5F5',
                  border: '1px solid #E0E0E0',
                  padding: '0.75rem 1rem'
                }}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="rounded-xl px-6"
                style={{ 
                  backgroundColor: 'var(--menufest-orange)',
                  color: 'white'
                }}
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Recipe Detail Modal */}
        {selectedMealDetail && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedMealDetail(null)}
          >
            <Card 
              className="max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
              style={{ 
                backgroundColor: 'white',
                borderRadius: '1.5rem'
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span 
                      className="px-3 py-1 rounded-full inline-block mb-2"
                      style={{ 
                        backgroundColor: 'var(--menufest-orange)',
                        color: 'white',
                        fontSize: '0.85rem',
                        fontWeight: '600'
                      }}
                    >
                      第 {selectedMealDetail.day} 天 · {selectedMealDetail.meal}
                    </span>
                    <h2 
                      className="m-0"
                      style={{ 
                        color: 'var(--menufest-green)',
                        fontSize: '1.5rem',
                        fontWeight: '700'
                      }}
                    >
                      {selectedMealDetail.name}
                    </h2>
                  </div>
                  <button
                    onClick={() => setSelectedMealDetail(null)}
                    className="p-2 rounded-lg hover:bg-gray-100"
                    style={{ fontSize: '1.5rem' }}
                  >
                    ×
                  </button>
                </div>

                <div className="mb-4">
                  <p className="text-gray-600 m-0" style={{ fontSize: '0.95rem' }}>
                    ⏱️ 烹飪時間：{selectedMealDetail.cookingTime}
                  </p>
                </div>

                <div className="mb-6">
                  <h3 
                    className="mb-3 m-0"
                    style={{ 
                      color: 'var(--menufest-green)',
                      fontSize: '1.2rem',
                      fontWeight: '600'
                    }}
                  >
                    🥘 食材
                  </h3>
                  <ul className="space-y-2 m-0 pl-5">
                    {selectedMealDetail.ingredients.map((ingredient, idx) => (
                      <li key={idx} className="text-gray-700" style={{ fontSize: '0.95rem' }}>
                        {ingredient}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 
                    className="mb-3 m-0"
                    style={{ 
                      color: 'var(--menufest-green)',
                      fontSize: '1.2rem',
                      fontWeight: '600'
                    }}
                  >
                    👨‍🍳 烹飪步驟
                  </h3>
                  <ol className="space-y-3 m-0 pl-5">
                    {selectedMealDetail.steps.map((step, idx) => (
                      <li 
                        key={idx} 
                        className="text-gray-700"
                        style={{ fontSize: '0.95rem', lineHeight: '1.6' }}
                      >
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Feedback Modal */}
        {showFeedbackModal && (
          <div 
            className="feedback-modal-overlay fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
            style={{ backdropFilter: 'blur(4px)' }}
          >
            <Card 
              className="feedback-modal-content max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
              style={{ 
                backgroundColor: 'white',
                borderRadius: '20px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
              }}
            >
              <CardContent className="p-6">
                {!feedbackSubmitted ? (
                  <>
                    {/* Header */}
                    <div className="text-center mb-6">
                      <h2 
                        className="m-0 mb-2"
                        style={{ 
                          color: 'var(--menufest-green)',
                          fontSize: '1.5rem',
                          fontWeight: '700',
                          fontFamily: 'Comic Neue, cursive'
                        }}
                      >
                        您的菜單對話體驗如何？
                      </h2>
                      <p className="text-gray-600 m-0" style={{ fontSize: '0.95rem' }}>
                        您的回饋將幫助 Menufest 改善下次的菜單規劃
                      </p>
                    </div>

                    {/* Star Rating */}
                    <div className="mb-6">
                      <Label className="mb-3 block text-center" style={{ fontSize: '0.9rem', color: '#666' }}>
                        整體評分（選填）
                      </Label>
                      <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="star-rating p-1"
                          >
                            <Star
                              className="w-10 h-10"
                              fill={(hoverRating || rating) >= star ? '#FFB800' : 'none'}
                              stroke={(hoverRating || rating) >= star ? '#FFB800' : '#D1D5DB'}
                              style={{ transition: 'all 0.2s ease' }}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Feedback Text */}
                    <div className="mb-4">
                      <Label htmlFor="feedback" className="mb-2 block" style={{ fontSize: '0.9rem', color: '#666' }}>
                        分享您的想法
                      </Label>
                      <Textarea
                        id="feedback"
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="例如：太油了，下次不要香菜。整體不錯～"
                        rows={4}
                        className="rounded-lg resize-none"
                        style={{ 
                          fontSize: '0.95rem',
                          border: '2px solid #E5E7EB'
                        }}
                      />
                    </div>

                    {/* Attach Chat Checkbox */}
                    <div className="flex items-center gap-2 mb-6">
                      <Checkbox
                        id="attachChat"
                        checked={attachChat}
                        onCheckedChange={(checked) => setAttachChat(checked as boolean)}
                      />
                      <Label 
                        htmlFor="attachChat" 
                        className="cursor-pointer m-0"
                        style={{ fontSize: '0.9rem', color: '#666' }}
                      >
                        附加此次對話記錄到回饋
                      </Label>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button
                        onClick={handleSkipFeedback}
                        variant="outline"
                        className="flex-1 rounded-lg"
                        style={{ 
                          fontSize: '1rem',
                          fontWeight: '600',
                          borderColor: '#D1D5DB'
                        }}
                      >
                        跳過
                      </Button>
                      <Button
                        onClick={handleSubmitFeedback}
                        disabled={isSubmitting}
                        className="flex-1 rounded-lg"
                        style={{ 
                          backgroundColor: 'var(--menufest-green)',
                          color: 'white',
                          fontSize: '1rem',
                          fontWeight: '600'
                        }}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            送出中...
                          </>
                        ) : (
                          '提交回饋'
                        )}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Success State */}
                    <div className="text-center py-8">
                      <div 
                        className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: '#D1FAE5' }}
                      >
                        <Check className="w-10 h-10" style={{ color: '#10B981' }} />
                      </div>
                      <h2 
                        className="m-0 mb-3"
                        style={{ 
                          color: 'var(--menufest-green)',
                          fontSize: '1.5rem',
                          fontWeight: '700',
                          fontFamily: 'Comic Neue, cursive'
                        }}
                      >
                        感謝您的回饋！
                      </h2>
                      <p className="text-gray-600 mb-6 m-0" style={{ fontSize: '1rem' }}>
                        我們會記住您的建議，讓下次的菜單規劃更貼心
                      </p>
                      <Button
                        onClick={handleCloseFeedback}
                        className="px-8 rounded-lg"
                        style={{ 
                          backgroundColor: 'var(--menufest-green)',
                          color: 'white',
                          fontSize: '1rem',
                          fontWeight: '600'
                        }}
                      >
                        關閉
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
