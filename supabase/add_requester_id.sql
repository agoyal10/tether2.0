-- Migration: track who initiated a connection request
-- Run this in your Supabase SQL editor

ALTER TABLE public.connections
  ADD COLUMN IF NOT EXISTS requester_id uuid REFERENCES public.profiles(id);
