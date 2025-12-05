-- Fix responseTone ENUM type
DO $$ BEGIN
    CREATE TYPE "enum_Settings_responseTone" AS ENUM ('professional', 'friendly', 'concise', 'detailed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "Settings" 
    ALTER COLUMN "responseTone" DROP DEFAULT,
    ALTER COLUMN "responseTone" TYPE "enum_Settings_responseTone" USING "responseTone"::"enum_Settings_responseTone",
    ALTER COLUMN "responseTone" SET DEFAULT 'professional'::"enum_Settings_responseTone";
