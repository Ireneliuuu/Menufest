import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { UserProfile } from '../App';

interface SettingsScreenProps {
  user: UserProfile | null;
  onSave: (user: UserProfile) => void;
}

export function SettingsScreen({ user, onSave }: SettingsScreenProps) {
  const [formData, setFormData] = useState<UserProfile>(user || {
    fullName: '',
    email: '',
    dietPreferences: [],
    allergies: [],
    healthRestrictions: [],
    otherPreferences: ''
  });

  const dietOptions = ['Vegetarian', 'Vegan', 'Pescatarian', 'Keto', 'Paleo', 'Mediterranean'];
  const allergyOptions = ['Nuts', 'Shellfish', 'Dairy', 'Eggs', 'Soy', 'Gluten', 'Fish'];
  const healthOptions = ['Low Sugar', 'Gluten-Free', 'Low Sodium', 'Low Fat', 'High Protein', 'Diabetic-Friendly'];

  const handleCheckboxChange = (category: keyof Pick<UserProfile, 'dietPreferences' | 'allergies' | 'healthRestrictions'>, value: string) => {
    setFormData(prev => ({
      ...prev,
      [category]: prev[category].includes(value) 
        ? prev[category].filter(item => item !== value)
        : [...prev[category], value]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: 'var(--menufest-cream)' }}>
      <div className="max-w-md mx-auto">
        <Card style={{ backgroundColor: 'var(--menufest-white)' }}>
          <CardHeader style={{ backgroundColor: 'var(--menufest-green)' }}>
            <CardTitle className="text-center" style={{ color: 'var(--menufest-white)' }}>
              Personal Information
            </CardTitle>
            <p className="text-center text-sm" style={{ color: 'var(--menufest-cream)' }}>
              Tell us about your preferences
            </p>
          </CardHeader>
          
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  required
                  style={{ backgroundColor: 'var(--menufest-cream)' }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  style={{ backgroundColor: 'var(--menufest-cream)' }}
                />
              </div>

              <div className="space-y-3">
                <Label>Diet Preferences</Label>
                <div className="grid grid-cols-2 gap-2">
                  {dietOptions.map((diet) => (
                    <div key={diet} className="flex items-center space-x-2">
                      <Checkbox
                        id={`diet-${diet}`}
                        checked={formData.dietPreferences.includes(diet)}
                        onCheckedChange={() => handleCheckboxChange('dietPreferences', diet)}
                      />
                      <label htmlFor={`diet-${diet}`} className="text-sm">
                        {diet}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Allergies</Label>
                <div className="grid grid-cols-2 gap-2">
                  {allergyOptions.map((allergy) => (
                    <div key={allergy} className="flex items-center space-x-2">
                      <Checkbox
                        id={`allergy-${allergy}`}
                        checked={formData.allergies.includes(allergy)}
                        onCheckedChange={() => handleCheckboxChange('allergies', allergy)}
                      />
                      <label htmlFor={`allergy-${allergy}`} className="text-sm">
                        {allergy}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Health Restrictions</Label>
                <div className="grid grid-cols-2 gap-2">
                  {healthOptions.map((health) => (
                    <div key={health} className="flex items-center space-x-2">
                      <Checkbox
                        id={`health-${health}`}
                        checked={formData.healthRestrictions.includes(health)}
                        onCheckedChange={() => handleCheckboxChange('healthRestrictions', health)}
                      />
                      <label htmlFor={`health-${health}`} className="text-sm">
                        {health}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="otherPreferences">Other Preferences</Label>
                <Textarea
                  id="otherPreferences"
                  placeholder="Any other dietary preferences or comments..."
                  value={formData.otherPreferences}
                  onChange={(e) => setFormData(prev => ({ ...prev, otherPreferences: e.target.value }))}
                  className="min-h-20"
                  style={{ backgroundColor: 'var(--menufest-cream)' }}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full mt-6"
                style={{ 
                  backgroundColor: 'var(--menufest-orange)',
                  color: 'white'
                }}
              >
                Save & Continue
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}