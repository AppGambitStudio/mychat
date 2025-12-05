-- Migration: Add widget_status to chat_spaces
ALTER TABLE chat_spaces ADD COLUMN widget_status TEXT DEFAULT 'testing';
