import { useState, useEffect } from "react";
import { useDelayedSpinner } from "@/hooks/useDelayedSpinner";
import { Plus, Trash2, Calendar as CalendarIcon, Clock, Heart, ChevronLeft, ChevronRight, X } from "lucide-react";
import { motion } from "framer-motion";
import { api, type ApiEvent } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export default function Calendar() {
  const { user } = useAuth();
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [fetching, setFetching] = useState(true);
  const showLoading = useDelayedSpinner(fetching);
  const [showAdd, setShowAdd] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ApiEvent | null>(null);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState<"date" | "anniversary" | "reminder">("date");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await api.getEvents();
      setEvents(data);
    } catch (err) {
      console.error("Failed to load events:", err);
    } finally {
      setFetching(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !user) return;
    setSubmitting(true);
    try {
      const event = await api.addEvent({
        title: title.trim(),
        date,
        time,
        description: description.trim(),
        type: eventType,
        author: user.id,
      });
      setEvents((prev) => [...prev, event]);
      setTitle("");
      setDate("");
      setTime("");
      setDescription("");
      setShowAdd(false);
    } catch (err) {
      console.error("Failed to add event:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent || !title.trim() || !date) return;
    setSubmitting(true);
    try {
      const updated = await api.updateEvent(editingEvent.id, {
        title: title.trim(),
        date,
        time,
        description: description.trim(),
        type: eventType,
      });
      setEvents((prev) => prev.map((ev) => (ev.id === updated.id ? updated : ev)));
      setEditingEvent(null);
      setTitle("");
      setDate("");
      setTime("");
      setDescription("");
    } catch (err) {
      console.error("Failed to update event:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.deleteEvent(deleteId);
      setEvents((prev) => prev.filter((ev) => ev.id !== deleteId));
    } catch (err) {
      console.error("Failed to delete event:", err);
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const startEdit = (event: ApiEvent) => {
    setEditingEvent(event);
    setTitle(event.title);
    setDate(event.date);
    setTime(event.time || "");
    setDescription(event.description || "");
    setEventType(event.type);
    setShowAdd(true);
  };

  const cancelEdit = () => {
    setEditingEvent(null);
    setTitle("");
    setDate("");
    setTime("");
    setDescription("");
    setShowAdd(false);
  };

  // Calendar navigation
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDay = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days = [];
    // Empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    // Days of the month
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getEventsForDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`;
    return events.filter((ev) => ev.date === dateStr);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getCountdown = (eventDate: string, eventTime?: string) => {
    const eventDateTime = new Date(`${eventDate}${eventTime ? 'T' + eventTime : ''}`);
    const now = new Date();
    const diff = eventDateTime.getTime() - now.getTime();

    if (diff <= 0) return null;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const days = generateCalendarDays();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="max-w-[600px] mx-auto pb-20 md:pb-6">
      {/* Header */}
      <div className="px-4 py-5 border-b border-border flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
            <CalendarIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold text-base">Calendar</h1>
            <p className="text-xs text-muted-foreground">Plan dates & special moments</p>
          </div>
        </div>
        <button
          onClick={() => { setEditingEvent(null); setTitle(""); setDate(""); setTime(""); setDescription(""); setShowAdd(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
          data-testid="button-add-event"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      {/* Add/Edit Event Form */}
      {showAdd && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="border-b border-border bg-card/50"
        >
          <form onSubmit={editingEvent ? handleUpdate : handleAdd} className="p-4 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold">{editingEvent ? "Edit Event" : "Add Event"}</p>
              <button type="button" onClick={cancelEdit} className="text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title..."
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
              data-testid="input-event-title"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
                data-testid="input-event-date"
              />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
                data-testid="input-event-time"
              />
            </div>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as any)}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
              data-testid="input-event-type"
            >
              <option value="date">📅 Date</option>
              <option value="anniversary">💕 Anniversary</option>
              <option value="reminder">🔔 Reminder</option>
            </select>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)..."
              rows={2}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors resize-none"
              data-testid="input-event-description"
            />
            <button
              type="submit"
              disabled={!title.trim() || !date || submitting}
              className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl disabled:opacity-50 text-sm"
              data-testid="button-submit-event"
            >
              {submitting ? "Saving..." : editingEvent ? "Update Event" : "Add Event"}
            </button>
          </form>
        </motion.div>
      )}

      {/* Calendar View */}
      <div className="p-4">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={goToPreviousMonth} className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-lg">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h2>
            <button onClick={goToToday} className="text-xs text-primary hover:underline">Today</button>
          </div>
          <button onClick={goToNextMonth} className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="bg-card/50 border border-border rounded-2xl overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-border">
            {dayNames.map((day) => (
              <div key={day} className="p-2 text-center text-xs font-semibold text-muted-foreground">
                {day}
              </div>
            ))}
          </div>
          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {days.map((date, index) => {
              if (!date) {
                return <div key={index} className="p-2" />;
              }
              const dayEvents = getEventsForDate(date);
              const today = isToday(date);
              return (
                <div
                  key={index}
                  className={`p-2 min-h-[60px] border-b border-r border-border last:border-r-0 hover:bg-secondary/30 transition-colors cursor-pointer ${today ? 'bg-primary/5' : ''}`}
                >
                  <div className={`text-sm font-medium ${today ? 'text-primary' : ''}`}>{date.getDate()}</div>
                  {dayEvents.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {dayEvents.slice(0, 2).map((ev) => (
                        <div
                          key={ev.id}
                          className={`text-[10px] px-1.5 py-0.5 rounded truncate ${
                            ev.type === 'anniversary' ? 'bg-pink-500/20 text-pink-600' :
                            ev.type === 'reminder' ? 'bg-yellow-500/20 text-yellow-600' :
                            'bg-primary/20 text-primary'
                          }`}
                        >
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[10px] text-muted-foreground">+{dayEvents.length - 2} more</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Events List */}
        <div className="mt-6">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Upcoming Events
          </h3>
          {showLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-secondary/50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center gap-2">
              <CalendarIcon className="w-12 h-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No events yet</p>
              <p className="text-xs text-muted-foreground/60">Add your first event to plan together</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events
                .filter((ev) => new Date(ev.date) >= new Date(new Date().setHours(0, 0, 0, 0)))
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((ev) => {
                  const countdown = getCountdown(ev.date, ev.time);
                  return (
                    <motion.div
                      key={ev.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-card/50 border border-border rounded-2xl p-4 hover:bg-card/70 transition-colors"
                      data-testid={`event-${ev.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {ev.type === 'anniversary' && <Heart className="w-4 h-4 text-pink-500" />}
                            {ev.type === 'reminder' && <Clock className="w-4 h-4 text-yellow-500" />}
                            <p className="font-semibold text-sm">{ev.title}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">
                            {new Date(ev.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                            {ev.time && ` at ${ev.time}`}
                          </p>
                          {ev.description && <p className="text-xs text-muted-foreground">{ev.description}</p>}
                          {countdown && (
                            <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-lg">
                              <Clock className="w-3 h-3 text-primary" />
                              <span className="text-xs font-medium text-primary">{countdown}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => startEdit(ev)}
                            className="p-1.5 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                            data-testid={`button-edit-event-${ev.id}`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteId(ev.id)}
                            className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors text-muted-foreground hover:text-destructive"
                            data-testid={`button-delete-event-${ev.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete this event?"
        description="It will be removed from your shared calendar."
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
