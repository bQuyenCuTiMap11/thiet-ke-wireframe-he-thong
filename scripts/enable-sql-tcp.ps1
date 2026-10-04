$ErrorActionPreference = 'Stop'

$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = [Security.Principal.WindowsPrincipal]::new($identity)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw 'Hãy mở VS Code bằng Run as administrator rồi chạy lại task này.'
}

$instanceNamesPath = 'HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\Instance Names\SQL'
$instanceNames = Get-ItemProperty -Path $instanceNamesPath
$instanceId = $instanceNames.MSSQLSERVER
if (-not $instanceId) { throw 'Không tìm thấy instance MSSQLSERVER.' }

$tcpPath = "HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\$instanceId\MSSQLServer\SuperSocketNetLib\Tcp"
$ipAllPath = "$tcpPath\IPAll"
Set-ItemProperty -Path $tcpPath -Name Enabled -Value 1
Set-ItemProperty -Path $ipAllPath -Name TcpPort -Value '1433'
Set-ItemProperty -Path $ipAllPath -Name TcpDynamicPorts -Value ''

Restart-Service -Name MSSQLSERVER -Force
Write-Output 'SQL Server TCP/IP đã bật và dịch vụ MSSQLSERVER đã restart.'
Write-Output 'Kiểm tra tiếp: http://localhost:3001/api/health/database'
