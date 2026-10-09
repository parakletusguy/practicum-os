-- Practice evidence must never be served through a public object URL.
-- Application access is brokered by a server-side authorization check and a
-- short-lived signed URL.
UPDATE storage.buckets
SET public = false
WHERE id = 'evidence-vault';
