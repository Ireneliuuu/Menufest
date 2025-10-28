import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { UserProfile, FamilyMember, Screen } from '../App';
import { 
  Home, ChefHat, User, Edit, Save, X, Plus, Trash2, 
  Heart, ShieldAlert, Users, Check 
} from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from './ui/sonner';

import { getMe, updateMyProfile, MeResponse } from '@/api/profiles';
import { listFamily, createFamily, updateFamily, deleteFamily } from "@/api/family";

// helper: safely convert ISO string -> "YYYY-MM-DD" for <input type="date">
const toDateInput = (v: string | null | undefined) => v ? String(v).slice(0, 10) : "";

// Helper: API -> UI mapping (accepts either {member:...} or raw object)
const toUiMember = (m: any): FamilyMember => ({
  id: m.id ?? m.family_member_id,
  name: m.name ?? '',
  relation: m.relation ?? '',
  allergies: Array.isArray(m.allergies) ? m.allergies : [],
  preferences: Array.isArray(m.preferences) ? m.preferences : [],
});

interface ProfileScreenProps {
  user: UserProfile | null;
  onUpdateUser: (user: UserProfile) => void;
  onNavigate: (screen: Screen) => void;
}

export function ProfileScreen({ user, onUpdateUser, onNavigate }: ProfileScreenProps) {
  // ---- NEW: backend data + loading states ----
  const [backend, setBackend] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [familySaving, setFamilySaving] = useState(false);
  
  // State for editing
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);
  const [showEditFamilyModal, setShowEditFamilyModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  
  // Form state
  const [personalInfo, setPersonalInfo] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    birthday: user?.birthday || ''
  });
  
  const [allergies, setAllergies] = useState<string[]>(user?.allergies || []);
  const [allergyInput, setAllergyInput] = useState('');
  
  const [preferences, setPreferences] = useState<string[]>(user?.dietPreferences || []);
  const [preferenceInput, setPreferenceInput] = useState('');
  
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(user?.familyMembers || []);
  
  // Family member form
  const [familyForm, setFamilyForm] = useState({
    name: '',
    relation: '',
    allergies: [] as string[],
    preferences: [] as string[]
  });
  const [familyAllergyInput, setFamilyAllergyInput] = useState('');
  const [familyPrefInput, setFamilyPrefInput] = useState('');

  // ===== NEW: fetch profile from backend on mount =====
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const me = await getMe(); // GET /profiles/me
        setBackend(me);

        // hydrate UI state with backend values
        setPersonalInfo({
          fullName: me.username || '',
          email: me.email || '',
          birthday: toDateInput(me.birthday) // backend already returns YYYY-MM-DD
        });
        setAllergies(me.profile.allergies || []);
        setPreferences(me.profile.preferences || []);
      } catch (e: any) {
        toast.error(e?.response?.data?.error || '載入個人資料失敗');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // // Fetch family members after profile loads
  // useEffect(() => {
  //   if (!user) return;
  //   (async () => {
  //     try {
  //       const members = await listFamily(); // returns {members:[{id,name,...}]}
  //       setFamilyMembers(
  //         members.map(m => ({
  //           id: m.family_member_id,                       // API already returns "id"
  //           name: m.name,
  //           relation: m.relation ?? "",
  //           allergies: Array.isArray(m.allergies) ? m.allergies : [],
  //           preferences: Array.isArray(m.preferences) ? m.preferences : [],
  //         }))
  //       );
  //     } catch (e: any) {
  //       // optional toast
  //       // toast.error(e?.response?.data?.error || "載入家庭成員失敗");
  //       console.error("listFamily error:", e);
  //     }
  //   })();
  // }, [user]);
    useEffect(() => {
    (async () => {
      try {
        const members = await listFamily();      // <-- now always an array
        setFamilyMembers(members.map(toUiMember));
      } catch (e) {
        toast.error('載入家庭成員失敗');
        console.error(e);
      }
    })();
  }, []);

  // Handle personal info save
  const handleSavePersonal = () => {
    setIsEditingPersonal(false);
    toast.success('個人資料已更新 ✅（尚未送出）');
  };

  // Add tag helpers(過敏與偏好)
  const handleAddAllergy = () => {
    const v = allergyInput.trim();
    if (v && !allergies.includes(v)) setAllergies([...allergies, v]);
    setAllergyInput('');
  };

  const handleAddPreference = () => {
    const v = preferenceInput.trim();
    if (v && !preferences.includes(v)) setPreferences([...preferences, v]);
    setPreferenceInput('');
  };

  // family ---------------------------------------------
  // Handle family member add
  const handleAddFamilyMember = async () => {
  if (!familyForm.name || !familyForm.relation) return;
  try {
    setFamilySaving(true);
    const resp = await createFamily({
      name: familyForm.name,
      relation: familyForm.relation,
      allergies: familyForm.allergies,
      preferences: familyForm.preferences,
    });

    // API may return { member: ... } or raw member
    const m = (resp as any).member ?? resp;
    const ui = toUiMember(m);

    setFamilyMembers(prev => [...prev, ui]);
    setShowAddFamilyModal(false);
    setFamilyForm({ name: "", relation: "", allergies: [], preferences: [] });
    toast.success("家庭成員已添加 ✅");
  } catch (e: any) {
    console.error("createFamily error:", e);
    toast.error(e?.response?.data?.error || "新增失敗");
  } finally {
    setFamilySaving(false);
  }
  };


  // Handle family member edit
  const handleEditFamilyMember = async () => {
  if (!editingMember || !familyForm.name || !familyForm.relation) return;
  try {
    setFamilySaving(true);
    const resp = await updateFamily(editingMember.id, {
      name: familyForm.name,
      relation: familyForm.relation,
      allergies: familyForm.allergies,
      preferences: familyForm.preferences,
    });

    const m = (resp as any).member ?? resp;
    const ui = toUiMember(m);

    setFamilyMembers(prev => prev.map(mem => (mem.id === editingMember.id ? ui : mem)));
    setShowEditFamilyModal(false);
    setEditingMember(null);
    setFamilyForm({ name: "", relation: "", allergies: [], preferences: [] });
    toast.success("家庭成員已更新 ✅");
  } catch (e: any) {
    console.error("updateFamily error:", e);
    toast.error(e?.response?.data?.error || "更新失敗");
  } finally {
    setFamilySaving(false);
  }
  };

  // Open edit family modal
  const openEditFamilyModal = (member: FamilyMember) => {
    setEditingMember(member);
    setFamilyForm({
      name: member.name,
      relation: member.relation,
      allergies: [...member.allergies],
      preferences: [...member.preferences]
    });
    setShowEditFamilyModal(true);
  };

  // Handle delete family member
  const handleDeleteFamilyMember = async () => {
  if (!memberToDelete) return;
  try {
    setFamilySaving(true);
    await deleteFamily(memberToDelete);
    setFamilyMembers(prev => prev.filter(m => m.id !== memberToDelete));
    setMemberToDelete(null);
    setShowDeleteDialog(false);
    toast.success("家庭成員已刪除");
  } catch (e: any) {
    console.error("deleteFamily error:", e);
    toast.error(e?.response?.data?.error || "刪除失敗");
  } finally {
    setFamilySaving(false);
  }
  };

  // family ---------------------------------------------

  // ===== NEW: persist to backend (PUT /profiles/me) =====
  const handleSaveAll = async () => {
    try {
      setSaving(true);
      const payload = {
        birthday: personalInfo.birthday || null,      // '' → null
        allergies,                                     // string[]
        preferences                                    // string[]
      };
      const updated = await updateMyProfile(payload);  // PUT /profiles/me
      setBackend(updated);

      // reflect backend response to UI
      setPersonalInfo({
        fullName: updated.username || '',
        email: updated.email || '',
        birthday: toDateInput(updated.birthday)
      });
      setAllergies(updated.profile.allergies || []);
      setPreferences(updated.profile.preferences || []);

      // (optional) also update parent app state if you want
      if (user) {
        onUpdateUser({
          ...user,
          fullName: updated.username || user.fullName,
          email: updated.email,
          birthday: updated.birthday ?? '',
          allergies: updated.profile.allergies || [],
          dietPreferences: updated.profile.preferences || [],
          familyMembers // still local only
        });
      }
      toast.success('所有變更已儲存 ✅');
    } catch (e: any) {
      toast.error(e?.response?.data?.error || '儲存失敗');
    } finally {
      setSaving(false);
      setIsEditingPersonal(false);
    }
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  if (loading) {
    return (
      <div className="p-6 text-gray-500">載入中…</div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;600;700&display=swap');
        
        .profile-container {
          font-family: 'Inter', 'Noto Sans TC', sans-serif;
        }
        
        .tag-chip {
          animation: fadeScale 0.2s ease-out;
        }
        
        @keyframes fadeScale {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .tag-chip-remove {
          animation: fadeOut 0.15s ease-out forwards;
        }
        
        @keyframes fadeOut {
          to {
            opacity: 0;
            transform: scale(0.8);
          }
        }
        
        .slide-toggle {
          transition: all 0.3s ease;
        }
        
        .family-card {
          transition: all 0.2s ease;
        }
        
        .family-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
        }
      `}</style>

      <div className="profile-container min-h-screen flex flex-col" style={{ backgroundColor: '#F8F9FA' }}>
        <Toaster position="top-center" />
        
        {/* Top Navigation */}
        <div 
          className="p-4 flex items-center justify-between"
          style={{ 
            backgroundColor: 'var(--menufest-green)',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
          }}
        >
          <h1 
            className="m-0"
            style={{ 
              color: 'var(--menufest-white)',
              fontSize: '1.5rem',
              fontWeight: '700'
            }}
          >
            Profile
          </h1>
          
          <Button
            onClick={handleSaveAll}
            className="rounded-lg"
            style={{ 
              backgroundColor: 'var(--menufest-orange)',
              color: 'white',
              fontWeight: '600'
            }}
          >
            <Check className="w-4 h-4 mr-2" />
            儲存所有變更
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 pb-20 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            {/* 2x2 Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Row 1, Col 1 - Personal Information Card */}
              <Card style={{ borderRadius: '1rem', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)' }}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle style={{ color: 'var(--menufest-green)' }}>
                        個人資料
                      </CardTitle>
                      <Button
                        onClick={() => {
                          if (isEditingPersonal) {
                            handleSavePersonal();
                          } else {
                            setIsEditingPersonal(true);
                          }
                        }}
                        size="sm"
                        className="slide-toggle rounded-lg"
                        style={{ 
                          backgroundColor: isEditingPersonal ? 'var(--menufest-orange)' : 'var(--menufest-green)',
                          color: 'white'
                        }}
                      >
                        {isEditingPersonal ? (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            儲存
                          </>
                        ) : (
                          <>
                            <Edit className="w-4 h-4 mr-2" />
                            編輯
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-4">
                      <div className="flex-1 space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="fullName">使用者名稱</Label>
                          <Input
                            id="fullName"
                            value={personalInfo.fullName}
                            onChange={(e) => setPersonalInfo(prev => ({ ...prev, fullName: e.target.value }))}
                            disabled={!isEditingPersonal}
                            className="rounded-lg"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            value={personalInfo.email}
                            disabled
                            className="rounded-lg bg-gray-100 text-gray-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="birthday">生日（選填）</Label>
                          <Input
                            id="birthday"
                            type="date"
                            value={personalInfo.birthday}
                            onChange={(e) => setPersonalInfo(prev => ({ ...prev, birthday: e.target.value }))}
                            disabled={!isEditingPersonal}
                            className="rounded-lg"
                          />
                        </div>
                      </div>

                      <Avatar className="w-16 h-16">
                        <AvatarFallback 
                          style={{ 
                            backgroundColor: 'var(--menufest-orange)',
                            color: 'white',
                            fontSize: '1.2rem',
                            fontWeight: '600'
                          }}
                        >
                          {getInitials(personalInfo.fullName || 'U')}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </CardContent>
                </Card>

              {/* Row 1, Col 2 - Family Members Card */}
              <Card style={{ borderRadius: '1rem', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)' }}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2" style={{ color: 'var(--menufest-green)' }}>
                          <Users className="w-5 h-5" />
                          家庭成員
                        </CardTitle>
                      </div>
                      <Button
                        onClick={() => {
                          setFamilyForm({
                            name: '',
                            relation: '',
                            allergies: [],
                            preferences: []
                          });
                          setShowAddFamilyModal(true);
                        }}
                        size="sm"
                        className="rounded-lg"
                        style={{ backgroundColor: 'var(--menufest-orange)', color: 'white' }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        添加
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {familyMembers.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-gray-400">尚未添加家庭成員</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {familyMembers.map((member) => (
                          <div
                            key={member.id}
                            className="family-card p-4 rounded-lg border group"
                            style={{ backgroundColor: '#FAFAFA' }}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="m-0 mb-1" style={{ fontWeight: '600', color: 'var(--menufest-green)' }}>
                                  {member.name}
                                </h4>
                                <p className="text-sm text-gray-600 m-0 mb-2">
                                  {member.relation}
                                </p>
                                
                                {(member.allergies.length > 0 || member.preferences.length > 0) && (
                                  <div className="space-y-2">
                                    {member.allergies.length > 0 && (
                                      <div>
                                        <p className="text-xs text-red-600 m-0 mb-1">過敏原：</p>
                                        <div className="flex flex-wrap gap-1">
                                          {member.allergies.map((allergy, idx) => (
                                            <span
                                              key={idx}
                                              className="inline-flex items-center px-2 py-0.5 rounded-full"
                                              style={{ 
                                                backgroundColor: '#FEE2E2',
                                                color: '#991B1B',
                                                fontSize: '0.75rem',
                                                fontWeight: '500'
                                              }}
                                            >
                                              {allergy}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {member.preferences.length > 0 && (
                                      <div>
                                        <p className="text-xs text-blue-600 m-0 mb-1">飲食偏好：</p>
                                        <div className="flex flex-wrap gap-1">
                                          {member.preferences.map((pref, idx) => (
                                            <span
                                              key={idx}
                                              className="inline-flex items-center px-2 py-0.5 rounded-full"
                                              style={{ 
                                                backgroundColor: '#DBEAFE',
                                                color: '#1E40AF',
                                                fontSize: '0.75rem',
                                                fontWeight: '500'
                                              }}
                                            >
                                              {pref}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => openEditFamilyModal(member)}
                                  className="p-2 rounded-lg hover:bg-white transition-colors"
                                >
                                  <Edit className="w-4 h-4" style={{ color: 'var(--menufest-green)' }} />
                                </button>
                                <button
                                  onClick={() => {
                                    setMemberToDelete(member.id);
                                    setShowDeleteDialog(true);
                                  }}
                                  className="p-2 rounded-lg hover:bg-white transition-colors"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

              {/* Row 2, Col 1 - Allergies Card */}
              <Card style={{ borderRadius: '1rem', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)' }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" style={{ color: 'var(--menufest-green)' }}>
                    <ShieldAlert className="w-5 h-5" />
                    過敏原
                  </CardTitle>
                  <p className="text-sm text-gray-600 m-0">
                    列出您希望 Menufest 避開的食材
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Input
                      placeholder="輸入過敏原（例如：蝦子、花生、乳製品...）"
                      value={allergyInput}
                      onChange={(e) => setAllergyInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddAllergy();
                        }
                      }}
                      className="rounded-lg"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {allergies.map((allergy, index) => (
                      <span
                        key={index}
                        className="tag-chip inline-flex items-center gap-2 px-3 py-1 rounded-full"
                        style={{ 
                          backgroundColor: '#FEE2E2',
                          color: '#991B1B',
                          fontSize: '0.9rem',
                          fontWeight: '500'
                        }}
                      >
                        {allergy}
                        <button
                          onClick={() => setAllergies(prev => prev.filter((_, i) => i !== index))}
                          className="hover:opacity-70"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  {allergies.length === 0 && (
                    <p className="text-gray-400 text-sm text-center py-4">
                      尚未添加過敏原
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Row 2, Col 2 - Preferences Card */}
              <Card style={{ borderRadius: '1rem', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)' }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" style={{ color: 'var(--menufest-green)' }}>
                    <Heart className="w-5 h-5" />
                    飲食偏好與健康需求
                  </CardTitle>
                  <p className="text-sm text-gray-600 m-0">
                    描述您的飲食口味、飲食目標或健康需求
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Input
                      placeholder="輸入偏好（例如：不吃辣、低鹽、素食、高蛋白...）"
                      value={preferenceInput}
                      onChange={(e) => setPreferenceInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddPreference();
                        }
                      }}
                      className="rounded-lg"
                    />
                    <p className="text-xs text-gray-500 m-0">
                      這些偏好將幫助 Menufest 生成更智慧、更個人化的菜單
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {preferences.map((pref, index) => (
                      <span
                        key={index}
                        className="tag-chip inline-flex items-center gap-2 px-3 py-1 rounded-full"
                        style={{ 
                          backgroundColor: '#DBEAFE',
                          color: '#1E40AF',
                          fontSize: '0.9rem',
                          fontWeight: '500'
                        }}
                      >
                        {pref}
                        <button
                          onClick={() => setPreferences(prev => prev.filter((_, i) => i !== index))}
                          className="hover:opacity-70"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  {preferences.length === 0 && (
                    <p className="text-gray-400 text-sm text-center py-4">
                      尚未添加飲食偏好
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div 
          className="fixed bottom-0 left-0 right-0 p-4" 
          style={{ 
            backgroundColor: 'var(--menufest-green)',
            boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
            zIndex: 50
          }}
        >
          <div className="flex justify-around max-w-md mx-auto">
            <button 
              onClick={() => onNavigate('fridge')}
              className="flex flex-col items-center space-y-1 p-2 rounded-lg transition-all hover:bg-white/10"
              style={{ color: 'var(--menufest-cream)' }}
            >
              <Home className="w-6 h-6" />
              <span style={{ fontSize: '0.75rem' }}>冰箱</span>
            </button>
            
            <button 
              onClick={() => onNavigate('home')}
              className="flex flex-col items-center space-y-1 p-2 rounded-lg transition-all hover:bg-white/10"
              style={{ color: 'var(--menufest-cream)' }}
            >
              <ChefHat className="w-6 h-6" />
              <span style={{ fontSize: '0.75rem' }}>首頁</span>
            </button>
            
            <button 
              className="flex flex-col items-center space-y-1 p-3 rounded-lg transition-all"
              style={{ 
                backgroundColor: 'var(--menufest-orange)',
                color: 'var(--menufest-white)'
              }}
            >
              <User className="w-6 h-6" />
              <span style={{ fontSize: '0.75rem' }}>個人</span>
            </button>
          </div>
        </div>

        {/* Add Family Member Modal */}
        <Dialog open={showAddFamilyModal} onOpenChange={setShowAddFamilyModal}>
          <DialogContent className="rounded-2xl max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle style={{ color: 'var(--menufest-green)' }}>
                添加家庭成員
              </DialogTitle>
              <DialogDescription>
                填寫家庭成員的資料
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="memberName">姓名 *</Label>
                <Input
                  id="memberName"
                  value={familyForm.name}
                  onChange={(e) => setFamilyForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="例如：媽媽、哥哥"
                  className="rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="relation">關係 *</Label>
                <Input
                  id="relation"
                  value={familyForm.relation}
                  onChange={(e) => setFamilyForm(prev => ({ ...prev, relation: e.target.value }))}
                  placeholder="例如：母親、兄弟"
                  className="rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label>過敏原</Label>
                <Input
                  placeholder="按 Enter 添加"
                  value={familyAllergyInput}
                  onChange={(e) => setFamilyAllergyInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && familyAllergyInput.trim()) {
                      e.preventDefault();
                      if (!familyForm.allergies.includes(familyAllergyInput.trim())) {
                        setFamilyForm(prev => ({
                          ...prev,
                          allergies: [...prev.allergies, familyAllergyInput.trim()]
                        }));
                        setFamilyAllergyInput('');
                      }
                    }
                  }}
                  className="rounded-lg"
                />
                <div className="flex flex-wrap gap-2">
                  {familyForm.allergies.map((allergy, index) => (
                    <span
                      key={index}
                      className="tag-chip inline-flex items-center gap-2 px-2 py-1 rounded-full"
                      style={{ backgroundColor: '#FEE2E2', color: '#991B1B', fontSize: '0.85rem' }}
                    >
                      {allergy}
                      <button
                        onClick={() => setFamilyForm(prev => ({
                          ...prev,
                          allergies: prev.allergies.filter((_, i) => i !== index)
                        }))}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>飲食偏好</Label>
                <Input
                  placeholder="按 Enter 添加"
                  value={familyPrefInput}
                  onChange={(e) => setFamilyPrefInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && familyPrefInput.trim()) {
                      e.preventDefault();
                      if (!familyForm.preferences.includes(familyPrefInput.trim())) {
                        setFamilyForm(prev => ({
                          ...prev,
                          preferences: [...prev.preferences, familyPrefInput.trim()]
                        }));
                        setFamilyPrefInput('');
                      }
                    }
                  }}
                  className="rounded-lg"
                />
                <div className="flex flex-wrap gap-2">
                  {familyForm.preferences.map((pref, index) => (
                    <span
                      key={index}
                      className="tag-chip inline-flex items-center gap-2 px-2 py-1 rounded-full"
                      style={{ backgroundColor: '#DBEAFE', color: '#1E40AF', fontSize: '0.85rem' }}
                    >
                      {pref}
                      <button
                        onClick={() => setFamilyForm(prev => ({
                          ...prev,
                          preferences: prev.preferences.filter((_, i) => i !== index)
                        }))}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button
                  onClick={() => setShowAddFamilyModal(false)}
                  variant="outline"
                  className="flex-1 rounded-lg"
                >
                  取消
                </Button>
                <Button
                  onClick={handleAddFamilyMember}
                  disabled={!familyForm.name || !familyForm.relation}
                  className="flex-1 rounded-lg"
                  style={{ backgroundColor: 'var(--menufest-orange)', color: 'white' }}
                >
                  添加
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Family Member Modal */}
        <Dialog open={showEditFamilyModal} onOpenChange={setShowEditFamilyModal}>
          <DialogContent className="rounded-2xl max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle style={{ color: 'var(--menufest-green)' }}>
                編輯家庭成員
              </DialogTitle>
              <DialogDescription>
                更新家庭成員的資料
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editMemberName">姓名 *</Label>
                <Input
                  id="editMemberName"
                  value={familyForm.name}
                  onChange={(e) => setFamilyForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="例如：媽媽、哥哥"
                  className="rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editRelation">關係 *</Label>
                <Input
                  id="editRelation"
                  value={familyForm.relation}
                  onChange={(e) => setFamilyForm(prev => ({ ...prev, relation: e.target.value }))}
                  placeholder="例如：母親、兄弟"
                  className="rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label>過敏原</Label>
                <Input
                  placeholder="按 Enter 添加"
                  value={familyAllergyInput}
                  onChange={(e) => setFamilyAllergyInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && familyAllergyInput.trim()) {
                      e.preventDefault();
                      if (!familyForm.allergies.includes(familyAllergyInput.trim())) {
                        setFamilyForm(prev => ({
                          ...prev,
                          allergies: [...prev.allergies, familyAllergyInput.trim()]
                        }));
                        setFamilyAllergyInput('');
                      }
                    }
                  }}
                  className="rounded-lg"
                />
                <div className="flex flex-wrap gap-2">
                  {familyForm.allergies.map((allergy, index) => (
                    <span
                      key={index}
                      className="tag-chip inline-flex items-center gap-2 px-2 py-1 rounded-full"
                      style={{ backgroundColor: '#FEE2E2', color: '#991B1B', fontSize: '0.85rem' }}
                    >
                      {allergy}
                      <button
                        onClick={() => setFamilyForm(prev => ({
                          ...prev,
                          allergies: prev.allergies.filter((_, i) => i !== index)
                        }))}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>飲食偏好</Label>
                <Input
                  placeholder="按 Enter 添加"
                  value={familyPrefInput}
                  onChange={(e) => setFamilyPrefInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && familyPrefInput.trim()) {
                      e.preventDefault();
                      if (!familyForm.preferences.includes(familyPrefInput.trim())) {
                        setFamilyForm(prev => ({
                          ...prev,
                          preferences: [...prev.preferences, familyPrefInput.trim()]
                        }));
                        setFamilyPrefInput('');
                      }
                    }
                  }}
                  className="rounded-lg"
                />
                <div className="flex flex-wrap gap-2">
                  {familyForm.preferences.map((pref, index) => (
                    <span
                      key={index}
                      className="tag-chip inline-flex items-center gap-2 px-2 py-1 rounded-full"
                      style={{ backgroundColor: '#DBEAFE', color: '#1E40AF', fontSize: '0.85rem' }}
                    >
                      {pref}
                      <button
                        onClick={() => setFamilyForm(prev => ({
                          ...prev,
                          preferences: prev.preferences.filter((_, i) => i !== index)
                        }))}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button
                  onClick={() => setShowEditFamilyModal(false)}
                  variant="outline"
                  className="flex-1 rounded-lg"
                >
                  取消
                </Button>
                <Button
                  onClick={handleEditFamilyMember}
                  disabled={!familyForm.name || !familyForm.relation}
                  className="flex-1 rounded-lg"
                  style={{ backgroundColor: 'var(--menufest-orange)', color: 'white' }}
                >
                  儲存
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>確認刪除</AlertDialogTitle>
              <AlertDialogDescription>
                您確定要刪除這位家庭成員嗎？此操作無法復原。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowDeleteDialog(false)} className="rounded-lg">
                取消
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteFamilyMember}
                className="rounded-lg"
                style={{ backgroundColor: '#DC2626', color: 'white' }}
              >
                刪除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}
