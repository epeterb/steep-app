#!/bin/bash

# Backup original
cp src/components/LibraryTab.tsx src/components/LibraryTab.tsx.backup

# Add import at line 4 (after existing imports)
sed -i '' '4a\
import AskLibraryChat from '\''./AskLibraryChat'\''
' src/components/LibraryTab.tsx

# Find line with "collections.length > 0" and add chat component after that closing div
# We'll insert it before the loading check section
sed -i '' '/)}$/a\
\
      <AskLibraryChat userId={userId} collectionId={selectedCollection || undefined} />
' src/components/LibraryTab.tsx

echo "✅ Chat component added!"
