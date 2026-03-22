
-- Create enum for competition type
CREATE TYPE public.competition_type AS ENUM ('image', 'text');

-- Create enum for class category
CREATE TYPE public.class_category AS ENUM ('chota_gat', 'motha_gat', 'khula_gat');

-- Competitions table
CREATE TABLE public.competitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type competition_type NOT NULL DEFAULT 'image',
  prefix TEXT NOT NULL DEFAULT 'R',
  is_locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Judges table
CREATE TABLE public.judges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  judge_code TEXT NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  has_submitted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(judge_code)
);

-- Entries table
CREATE TABLE public.entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  entry_code TEXT NOT NULL,
  participant_name TEXT NOT NULL,
  class_category class_category NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  image_url TEXT,
  UNIQUE(entry_code, competition_id)
);

-- Scores table
CREATE TABLE public.scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  judge_id UUID NOT NULL REFERENCES public.judges(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 10),
  creativity_score INTEGER CHECK (creativity_score >= 1 AND creativity_score <= 10),
  theme_score INTEGER CHECK (theme_score >= 1 AND theme_score <= 10),
  neatness_score INTEGER CHECK (neatness_score >= 1 AND neatness_score <= 10),
  remark TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(judge_id, entry_id)
);

-- Enable RLS on all tables
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

-- Admin role table
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role check
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for competitions
CREATE POLICY "Anyone can view competitions" ON public.competitions FOR SELECT USING (true);
CREATE POLICY "Admin can insert competitions" ON public.competitions FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update competitions" ON public.competitions FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete competitions" ON public.competitions FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for judges
CREATE POLICY "Admin can view all judges" ON public.judges FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can insert judges" ON public.judges FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update judges" ON public.judges FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete judges" ON public.judges FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for entries
CREATE POLICY "Anyone can view entries" ON public.entries FOR SELECT USING (true);
CREATE POLICY "Admin can insert entries" ON public.entries FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update entries" ON public.entries FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete entries" ON public.entries FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for scores
CREATE POLICY "Admin can view all scores" ON public.scores FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can manage scores" ON public.scores FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Storage bucket for competition entries
INSERT INTO storage.buckets (id, name, public) VALUES ('competition-entries', 'competition-entries', true);

CREATE POLICY "Anyone can view competition images" ON storage.objects FOR SELECT USING (bucket_id = 'competition-entries');
CREATE POLICY "Authenticated users can upload competition images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'competition-entries' AND auth.role() = 'authenticated');
CREATE POLICY "Admin can delete competition images" ON storage.objects FOR DELETE USING (bucket_id = 'competition-entries' AND auth.role() = 'authenticated');
