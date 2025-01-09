export interface StudyTask {
  id: string;
  title: string;
  description: string;
  subject: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  due_date: string;
  created_at: string;
}

export interface StudySession {
  id: string;
  subject: string;
  duration: number;
  date: string;
  notes: string;
}

export interface Resource {
  id: string;
  title: string;
  type: 'video' | 'article' | 'book' | 'note';
  subject: string;
  link?: string;
  notes?: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  type: 'short-term' | 'long-term';
  target_date: string;
  progress: number;
  status: 'not-started' | 'in-progress' | 'completed';
  milestones: Milestone[];
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  goal_id: string;
}