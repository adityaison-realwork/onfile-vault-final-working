-- Create config table for app settings
CREATE TABLE public.config (
  id INT NOT NULL DEFAULT 1 PRIMARY KEY,
  username TEXT NOT NULL DEFAULT 'om',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default config row
INSERT INTO public.config (id, username) VALUES (1, 'om');

-- Create file_groups table
CREATE TABLE public.file_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create files table
CREATE TABLE public.files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.file_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage bucket for files
INSERT INTO storage.buckets (id, name, public) VALUES ('onfile-storage', 'onfile-storage', false);

-- Create storage policies for file access
CREATE POLICY "Allow full access to files" ON storage.objects
FOR ALL USING (bucket_id = 'onfile-storage');

-- Enable RLS on all tables (though single-user, good practice)
ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations since single-user)
CREATE POLICY "Allow full access to config" ON public.config FOR ALL USING (true);
CREATE POLICY "Allow full access to file_groups" ON public.file_groups FOR ALL USING (true);
CREATE POLICY "Allow full access to files" ON public.files FOR ALL USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for config table
CREATE TRIGGER update_config_updated_at
  BEFORE UPDATE ON public.config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();