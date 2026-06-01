# Manté el sistema actiu fent servir l'API SetThreadExecutionState de Windows.
# Mètode oficial; no depèn de SendKeys ni de l'estat del focus.
# Per parar: tanca aquesta finestra.

$Host.UI.RawUI.WindowTitle = 'keep-awake -- pintem junts (TANCA per parar)'

Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class PowerMgmt {
    [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    public static extern uint SetThreadExecutionState(uint esFlags);
}
'@

# Flags:
#   ES_CONTINUOUS         = 0x80000000
#   ES_SYSTEM_REQUIRED    = 0x00000001  -> evita suspensió
#   ES_DISPLAY_REQUIRED   = 0x00000002  -> evita apagar/bloquejar pantalla
#   ES_AWAYMODE_REQUIRED  = 0x00000040  -> simula presencia ('away mode')
[PowerMgmt]::SetThreadExecutionState(0x80000043) | Out-Null

Write-Host ''
Write-Host '====================================================='
Write-Host '  KEEP-AWAKE actiu (SetThreadExecutionState)'
Write-Host '  La pantalla no es bloquejara mentre aquesta finestra'
Write-Host '  estigui oberta.'
Write-Host '  Per parar: tanca aquesta finestra.'
Write-Host '====================================================='

# Refresca el flag cada 30s (per assegurar contra reinicis del power manager)
# i toca SendKeys per redundancia.
$wsh = New-Object -ComObject WScript.Shell
while ($true) {
  [PowerMgmt]::SetThreadExecutionState(0x80000043) | Out-Null
  try { $wsh.SendKeys('{SCROLLLOCK 2}') } catch {}
  Start-Sleep -Seconds 30
}
