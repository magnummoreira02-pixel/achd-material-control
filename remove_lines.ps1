$lines = Get-Content 'index.html'
$newLines = $lines[0..4020] + $lines[4077..($lines.Count-1)]
Set-Content 'index.html' $newLines