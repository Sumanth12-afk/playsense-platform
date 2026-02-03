'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useAddChild } from '@/hooks/useChildren';
import { toast } from 'sonner';

export const AddChildDialog = () => {
  const [open, setOpen] = useState(false);
  const [childName, setChildName] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const addChild = useAddChild();

  const ageRanges = ['8-10', '11-13', '14-16', '17-18'];

  const handleSubmit = async () => {
    if (!childName.trim() || !ageRange) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSaving(true);
    try {
      await addChild.mutateAsync({ name: childName.trim(), age_range: ageRange });
      toast.success('Child profile created!');
      setOpen(false);
      setChildName('');
      setAgeRange('');
    } catch (error) {
      toast.error('Failed to create child profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full gap-2">
          <UserPlus className="h-4 w-4" />
          Add Child
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a child</DialogTitle>
          <DialogDescription>
            Add your child's profile to track their gaming activity.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Child's name
            </label>
            <Input
              placeholder="Enter name"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              className="h-12"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Age range
            </label>
            <div className="grid grid-cols-2 gap-3">
              {ageRanges.map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setAgeRange(range)}
                  className={cn(
                    'rounded-xl border-2 p-3 text-center transition-all',
                    ageRange === range
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-foreground hover:border-primary/50'
                  )}
                >
                  <span className="font-semibold">{range}</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">years old</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!childName.trim() || !ageRange || isSaving}
          >
            {isSaving ? 'Adding...' : 'Add Child'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

