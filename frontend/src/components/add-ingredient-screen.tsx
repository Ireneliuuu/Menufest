import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Ingredient, Screen } from '../App';
import { ArrowLeft, Camera, Type } from 'lucide-react';

interface AddIngredientScreenProps {
  onAddIngredient: (ingredient: Omit<Ingredient, 'id'>) => void;
  onNavigate: (screen: Screen) => void;
}

export function AddIngredientScreen({ onAddIngredient, onNavigate }: AddIngredientScreenProps) {
  const [method, setMethod] = useState<'scan' | 'manual' | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    expiryDate: '',
    category: '',
    quantity: ''
  });

  const categories = ['Vegetable', 'Fruit', 'Meat', 'Dairy', 'Grains', 'Spices', 'Other'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddIngredient(formData);
    onNavigate('fridge');
  };

  const handleScan = () => {
    // Simulate scanning - in real app would use camera
    alert('Camera scanning not available in demo. Please use manual input.');
    setMethod('manual');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--menufest-cream)' }}>
      {/* Header */}
      <div className="p-4" style={{ backgroundColor: 'var(--menufest-green)' }}>
        <div className="flex items-center space-x-3">
          <button onClick={() => onNavigate('fridge')}>
            <ArrowLeft className="w-6 h-6" style={{ color: 'var(--menufest-white)' }} />
          </button>
          <h1 className="text-xl" style={{ color: 'var(--menufest-white)' }}>
            Add Ingredient
          </h1>
        </div>
      </div>

      <div className="p-4">
        {!method && (
          <div className="space-y-4">
            <h2 className="text-lg text-center mb-6" style={{ color: 'var(--menufest-green)' }}>
              Choose how to add ingredient
            </h2>
            
            <Card className="cursor-pointer hover:shadow-md transition-shadow"
                  style={{ backgroundColor: 'var(--menufest-white)' }}
                  onClick={handleScan}>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                     style={{ backgroundColor: 'var(--menufest-orange)' }}>
                  <Camera className="w-8 h-8" style={{ color: 'var(--menufest-white)' }} />
                </div>
                <h3 className="text-lg mb-2" style={{ color: 'var(--menufest-green)' }}>
                  Scan Barcode
                </h3>
                <p className="text-sm text-gray-600">
                  Use your camera to scan product barcode
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow"
                  style={{ backgroundColor: 'var(--menufest-white)' }}
                  onClick={() => setMethod('manual')}>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                     style={{ backgroundColor: 'var(--menufest-green)' }}>
                  <Type className="w-8 h-8" style={{ color: 'var(--menufest-white)' }} />
                </div>
                <h3 className="text-lg mb-2" style={{ color: 'var(--menufest-green)' }}>
                  Manual Input
                </h3>
                <p className="text-sm text-gray-600">
                  Type ingredient details manually
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {method === 'manual' && (
          <Card style={{ backgroundColor: 'var(--menufest-white)' }}>
            <CardHeader>
              <CardTitle style={{ color: 'var(--menufest-green)' }}>
                Ingredient Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Ingredient Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Tomatoes"
                    required
                    style={{ backgroundColor: 'var(--menufest-cream)' }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger style={{ backgroundColor: 'var(--menufest-cream)' }}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                    placeholder="e.g., 5 pieces, 500g, 1L"
                    required
                    style={{ backgroundColor: 'var(--menufest-cream)' }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                    required
                    style={{ backgroundColor: 'var(--menufest-cream)' }}
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => setMethod(null)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1"
                    style={{ 
                      backgroundColor: 'var(--menufest-orange)',
                      color: 'white'
                    }}
                  >
                    Add Ingredient
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}