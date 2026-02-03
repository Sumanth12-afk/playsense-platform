'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  useSessionsWithNotes,
  useAddSessionNote,
  useDeleteSessionNote,
  SessionWithNote,
} from '@/hooks/useSessionNotes';
import {
  MessageSquare,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Gamepad2,
  Loader2,
  StickyNote,
} from 'lucide-react';
import { toast } from 'sonner';

interface SessionNotesCardProps {
  childId: string;
  childName: string;
  recentSessions?: Array<{
    id: string;
    game?: { name: string };
    started_at: string;
    duration_minutes: number;
    parent_note?: string | null;
  }>;
}

export function SessionNotesCard({ childId, childName, recentSessions }: SessionNotesCardProps) {
  const { data: notedSessions, isLoading } = useSessionsWithNotes(childId);
  const addNoteMutation = useAddSessionNote();
  const deleteNoteMutation = useDeleteSessionNote();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<SessionWithNote | null>(null);
  const [selectedSession, setSelectedSession] = useState<{
    id: string;
    gameName: string;
    startedAt: string;
    duration: number;
  } | null>(null);
  const [noteText, setNoteText] = useState('');

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const handleAddNote = (session: {
    id: string;
    gameName: string;
    startedAt: string;
    duration: number;
    existingNote?: string | null;
  }) => {
    setSelectedSession({
      id: session.id,
      gameName: session.gameName,
      startedAt: session.startedAt,
      duration: session.duration,
    });
    setNoteText(session.existingNote || '');
    setIsDialogOpen(true);
  };

  const handleSaveNote = async () => {
    if (!selectedSession || !noteText.trim()) return;

    try {
      await addNoteMutation.mutateAsync({
        sessionId: selectedSession.id,
        note: noteText.trim(),
      });
      toast.success('Note saved!');
      setIsDialogOpen(false);
      setNoteText('');
      setSelectedSession(null);
    } catch (error) {
      toast.error('Failed to save note');
    }
  };

  const handleDeleteNote = async (sessionId: string) => {
    try {
      await deleteNoteMutation.mutateAsync(sessionId);
      toast.success('Note deleted');
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  // Combine recent sessions (from today) with noted sessions for display
  const sessionsToShow = recentSessions?.slice(0, 5) || [];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <StickyNote className="h-5 w-5 text-primary" />
              Session Notes
            </CardTitle>
            {notedSessions && notedSessions.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {notedSessions.length} note{notedSessions.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Add context to gaming sessions - note who was playing together, special occasions, or
            anything helpful for conversations.
          </p>

          {/* Recent Sessions to Add Notes */}
          {sessionsToShow.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Recent Sessions</h4>
              <div className="space-y-2">
                {sessionsToShow.map((session) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Gamepad2 className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {session.game?.name || 'Unknown Game'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDuration(session.duration_minutes)}
                          <span>•</span>
                          {formatTime(session.started_at)}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant={session.parent_note ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() =>
                        handleAddNote({
                          id: session.id,
                          gameName: session.game?.name || 'Unknown Game',
                          startedAt: session.started_at,
                          duration: session.duration_minutes,
                          existingNote: session.parent_note,
                        })
                      }
                      className="gap-1"
                    >
                      {session.parent_note ? (
                        <>
                          <Edit2 className="h-3 w-3" />
                          Edit
                        </>
                      ) : (
                        <>
                          <Plus className="h-3 w-3" />
                          Add Note
                        </>
                      )}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Existing Notes */}
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : notedSessions && notedSessions.length > 0 ? (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Sessions with Notes</h4>
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {notedSessions.map((session) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="rounded-lg border border-border p-3 bg-muted/30"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm">{session.game_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatTime(session.started_at)} •{' '}
                            {formatDuration(session.duration_minutes)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleAddNote({
                                id: session.id,
                                gameName: session.game_name,
                                startedAt: session.started_at,
                                duration: session.duration_minutes,
                                existingNote: session.parent_note,
                              })
                            }
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteNote(session.id)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <p className="text-sm text-foreground">{session.parent_note}</p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ) : sessionsToShow.length === 0 ? (
            <div className="text-center py-6">
              <StickyNote className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">
                No sessions yet today. Notes will appear here as {childName} plays.
              </p>
            </div>
          ) : null}

          {/* Example Notes */}
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
            <h4 className="text-sm font-medium text-foreground mb-2">Example Notes</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>"Playing with school friends online"</li>
              <li>"Rewarded gaming time for finishing homework"</li>
              <li>"Rainy day - extra indoor time allowed"</li>
              <li>"Birthday celebration with cousins"</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Note Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedSession?.gameName
                ? `Add Note for ${selectedSession.gameName}`
                : 'Add Session Note'}
            </DialogTitle>
          </DialogHeader>

          {selectedSession && (
            <div className="text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {formatTime(selectedSession.startedAt)} • {formatDuration(selectedSession.duration)}
              </div>
            </div>
          )}

          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add context about this session... (e.g., who they were playing with, special occasion, etc.)"
            className="min-h-[100px]"
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveNote}
              disabled={!noteText.trim() || addNoteMutation.isPending}
            >
              {addNoteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Note'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
