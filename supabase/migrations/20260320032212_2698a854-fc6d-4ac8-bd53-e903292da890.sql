
-- Drop existing restrictive policies on competitions
DROP POLICY IF EXISTS "Admin can insert competitions" ON public.competitions;
DROP POLICY IF EXISTS "Admin can update competitions" ON public.competitions;
DROP POLICY IF EXISTS "Admin can delete competitions" ON public.competitions;

-- Drop existing restrictive policies on entries
DROP POLICY IF EXISTS "Admin can insert entries" ON public.entries;
DROP POLICY IF EXISTS "Admin can update entries" ON public.entries;
DROP POLICY IF EXISTS "Admin can delete entries" ON public.entries;

-- Drop existing restrictive policies on judges
DROP POLICY IF EXISTS "Admin can insert judges" ON public.judges;
DROP POLICY IF EXISTS "Admin can update judges" ON public.judges;
DROP POLICY IF EXISTS "Admin can delete judges" ON public.judges;
DROP POLICY IF EXISTS "Admin can view all judges" ON public.judges;

-- Drop existing restrictive policies on scores
DROP POLICY IF EXISTS "Admin can manage scores" ON public.scores;
DROP POLICY IF EXISTS "Admin can view all scores" ON public.scores;

-- Allow all operations on competitions
CREATE POLICY "Allow all insert competitions" ON public.competitions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update competitions" ON public.competitions FOR UPDATE USING (true);
CREATE POLICY "Allow all delete competitions" ON public.competitions FOR DELETE USING (true);

-- Allow all operations on entries
CREATE POLICY "Allow all insert entries" ON public.entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update entries" ON public.entries FOR UPDATE USING (true);
CREATE POLICY "Allow all delete entries" ON public.entries FOR DELETE USING (true);

-- Allow all operations on judges
CREATE POLICY "Allow all select judges" ON public.judges FOR SELECT USING (true);
CREATE POLICY "Allow all insert judges" ON public.judges FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update judges" ON public.judges FOR UPDATE USING (true);
CREATE POLICY "Allow all delete judges" ON public.judges FOR DELETE USING (true);

-- Allow all operations on scores
CREATE POLICY "Allow all select scores" ON public.scores FOR SELECT USING (true);
CREATE POLICY "Allow all insert scores" ON public.scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update scores" ON public.scores FOR UPDATE USING (true);
CREATE POLICY "Allow all delete scores" ON public.scores FOR DELETE USING (true);
