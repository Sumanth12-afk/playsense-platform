'use client';

import { useState } from 'react';
import { Pencil, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useUpdateChild, useDeleteChild, Child } from '@/hooks/useChildren';
import { toast } from 'sonner';

interface ChildManagementCardProps {
  child: Child;
}

export const ChildManagementCard = ({ child }: ChildManagementCardProps) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [childName, setChildName] = useState(child.name);
  const [ageRange, setAgeRange] = useState(child.age_range);
  const [isSaving, setIsSaving] = useState(false);

  const updateChild = useUpdateChild();
  const deleteChild = useDeleteChild();

  const ageRanges = ['8-10', '11-13', '14-16', '17-18'];

  const handleSave = async () => {
    if (!childName.trim()) {
      toast.error('Please enter a name');
      return;
    }

    setIsSaving(true);
    try {
      await updateChild.mutateAsync({
        id: child.id,
        name: childName.trim(),
        age_range: ageRange,
      });
      toast.success('Child profile updated!');
      setIsEditOpen(false);
    } catch (error) {
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteChild.mutateAsync(child.id);
      toast.success(`${child.name}'s profile has been deleted`);
      setIsDeleteOpen(false);
    } catch (error) {
      toast.error('Failed to delete profile. Please try again.');
    }
  };

  return (
    <>
      <div className="rounded-xl border border-border p-4 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-semibold">
              {child.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-foreground">{child.name}</p>
              <p className="text-sm text-muted-foreground">Age range: {child.age_range} years</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-2" onClick={() => setIsEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setIsDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Child Profile</DialogTitle>
            <DialogDescription>Update {child.name}'s profile information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Child's name</label>
              <Input
                placeholder="Enter name"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                className="h-12"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Age range</label>
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
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!childName.trim() || isSaving} className="gap-2">
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {child.name}'s Profile?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {child.name}'s profile and all associated gaming data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteChild.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete Profile'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
