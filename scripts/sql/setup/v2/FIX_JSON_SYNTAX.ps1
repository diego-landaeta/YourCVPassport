# Fix JSON syntax in all COMPLETE_*_V2.sql files
# Replace escaped JSON with jsonb_build_object() calls

$files = Get-ChildItem "c:\Users\molin\Downloads\yourcvpassport\scripts\sql\setup\v2\COMPLETE_*_V2.sql"

foreach ($file in $files) {
    Write-Host "Fixing: $($file.Name)"

    $content = Get-Content $file.FullName -Raw

    # Fix EMAIL stamp - replace '{\"email\":\"XXX\"}'::jsonb with jsonb_build_object('email','XXX')
    $content = $content -replace "'\{\\`"email\\`":\\`"([^`"]+)\\`"\}'::jsonb", "jsonb_build_object('email','`$1')"

    # Fix EDUCATION stamp - replace '{\"degree\":\"XXX\"}'::jsonb with jsonb_build_object('degree','XXX')
    $content = $content -replace "'\{\\`"degree\\`":\\`"([^`"]+)\\`"\}'::jsonb", "jsonb_build_object('degree','`$1')"

    # Fix LANGUAGE stamp with languages array - replace '{\"languages\":[...]}' with jsonb_build_object('languages',ARRAY[...])
    $content = $content -replace "'\{\\`"languages\\`":\[\\`"([^`"]+)\\`",\\`"([^`"]+)\\`"\]\}'::jsonb", "jsonb_build_object('languages',ARRAY['`$1','`$2'])"
    $content = $content -replace "'\{\\`"languages\\`":\[\\`"([^`"]+)\\`",\\`"([^`"]+)\\`",\\`"([^`"]+)\\`"\]\}'::jsonb", "jsonb_build_object('languages',ARRAY['`$1','`$2','`$3'])"

    Set-Content $file.FullName -Value $content -NoNewline
}

Write-Host "`nDone! Fixed all COMPLETE_*_V2.sql files"
