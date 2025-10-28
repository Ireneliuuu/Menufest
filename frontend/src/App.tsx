// app,tsk
import React, { useState } from 'react';
import { LoginScreen } from './components/login-screen';
import { RegisterScreen } from './components/register-screen';
import { SettingsScreen } from './components/settings-screen';
import { HomeScreen } from './components/home-screen';
import { FridgeScreen } from './components/fridge-screen';
import { ProfileScreen } from './components/profile-screen';
import { ChatbotScreen } from './components/chatbot-screen';
import { AddIngredientScreen } from './components/add-ingredient-screen';
import { MenuGeneratorScreen } from './components/menu-generator-screen';

export type Screen = 'login' | 'register' | 'settings' | 'home' | 'fridge' | 'profile' | 'chatbot' | 'add-ingredient' | 'menu-generator';

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  allergies: string[];
  preferences: string[];
}

export interface UserProfile {
  fullName: string;
  email: string;
  birthday?: string;
  dietPreferences: string[];
  allergies: string[];
  healthRestrictions: string[];
  otherPreferences: string;
  familyMembers: FamilyMember[];
}

export interface Ingredient {
  id: string;
  name: string;
  expiryDate: string;
  category: string;
  quantity: number;
  unit: '個' | '克' | '毫升';
}

export interface ChatHistory {
  id: string;
  title: string;
  date: string;
  summary: string;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    {
      id: '1',
      name: '番茄',
      expiryDate: '2025-11-02',
      category: '蔬菜',
      quantity: 5,
      unit: '個'
    },
    {
      id: '2',
      name: '雞胸肉',
      expiryDate: '2025-10-30',
      category: '肉類',
      quantity: 500,
      unit: '克'
    },
    {
      id: '3',
      name: '牛奶',
      expiryDate: '2025-10-28',
      category: '乳製品',
      quantity: 1000,
      unit: '毫升'
    },
    {
      id: '4',
      name: '雞蛋',
      expiryDate: '2025-11-05',
      category: '蛋類',
      quantity: 12,
      unit: '個'
    },
    {
      id: '5',
      name: '紅蘿蔔',
      expiryDate: '2025-11-10',
      category: '蔬菜',
      quantity: 3,
      unit: '個'
    }
  ]);
  
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([
    {
      id: '1',
      title: 'Weekly Mediterranean Menu',
      date: '2024-12-20',
      summary: '7-day Mediterranean diet menu for 2 people'
    },
    {
      id: '2',
      title: 'Quick Lunch Ideas',
      date: '2024-12-18',
      summary: '5 quick lunch recipes under 30 minutes'
    }
  ]);

  const updateIngredient = (id: string, updates: Partial<Ingredient>) => {
    setIngredients(prev => {
      const existing = prev.find(ing => ing.id === id);
      if (existing) {
        return prev.map(ing => 
          ing.id === id ? { ...ing, ...updates } : ing
        );
      } else {
        // Adding new ingredient
        return [...prev, { id, ...updates } as Ingredient];
      }
    });
  };

  const removeIngredient = (id: string) => {
    setIngredients(prev => prev.filter(ing => ing.id !== id));
  };

  const addIngredient = (ingredient: Omit<Ingredient, 'id'>) => {
    const newIngredient = {
      ...ingredient,
      id: Date.now().toString()
    };
    setIngredients(prev => [...prev, newIngredient]);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'login':
        return (
          <LoginScreen 
            onLogin={(userInfo) => {
              setUser(userInfo);
              setCurrentScreen(userInfo.fullName ? 'home' : 'settings');
            }}
            onNavigateToRegister={() => setCurrentScreen('register')}
          />
        );
      case 'register':
        return (
          <RegisterScreen 
            onRegister={(userInfo) => {
              setUser(userInfo);
              setCurrentScreen(userInfo.fullName ? 'home' : 'settings');
            }}
            onNavigateToLogin={() => setCurrentScreen('login')}
          />
        );
      case 'settings':
        return (
          <SettingsScreen 
            user={user}
            onSave={(userInfo) => {
              setUser(userInfo);
              setCurrentScreen('home');
            }}
          />
        );
      case 'home':
        return (
          <HomeScreen 
            user={user}
            chatHistories={chatHistories}
            onNavigate={setCurrentScreen}
            onLogout={() => {
              setUser(null);
              setCurrentScreen('login');
            }}
          />
        );
      case 'fridge':
        return (
          <FridgeScreen 
            ingredients={ingredients}
            onUpdateIngredient={updateIngredient}
            onRemoveIngredient={removeIngredient}
            onNavigate={setCurrentScreen}
          />
        );
      case 'profile':
        return (
          <ProfileScreen 
            user={user}
            onUpdateUser={setUser}
            onNavigate={setCurrentScreen}
          />
        );
      case 'chatbot':
        return (
          <ChatbotScreen 
            onNavigate={setCurrentScreen}
            onAddChatHistory={(chat) => setChatHistories(prev => [chat, ...prev])}
          />
        );
      case 'add-ingredient':
        return (
          <AddIngredientScreen 
            onAddIngredient={addIngredient}
            onNavigate={setCurrentScreen}
          />
        );
      case 'menu-generator':
        return (
          <MenuGeneratorScreen 
            onNavigate={setCurrentScreen}
            onAddChatHistory={(chat) => setChatHistories(prev => [chat, ...prev])}
          />
        );
      default:
        return <div>Screen not found</div>;
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8F9FA' }}>
      <style>
        {`:root {
          --menufest-green: #1B4332;
          --menufest-cream: #F8F9FA;
          --menufest-orange: #FF8500;
          --menufest-white: #FFFFFF;
        }`}
      </style>
      {renderScreen()}
    </div>
  );
}