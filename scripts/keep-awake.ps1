# Mantén la sessió de Windows activa enviant un toggle de ScrollLock cada 4 min.
# Per parar-lo: tanca aquesta finestra de PowerShell o executa
#   Get-Process | Where-Object { $_.MainWindowTitle -like '*keep-awake*' } | Stop-Process
$Host.UI.RawUI.WindowTitle = 'keep-awake — pintem junts'
Write-Host 'Keep-awake actiu — no es bloquejara la pantalla.'
Write-Host 'Tanca aquesta finestra per parar.'
$wsh = New-Object -ComObject WScript.Shell
while ($true) {
  $wsh.SendKeys('{SCROLLLOCK 2}')
  Start-Sleep -Seconds 240
}
