param([string]$in, [string]$out)
$pp = New-Object -ComObject PowerPoint.Application
$p = $pp.Presentations.Open($in, $true, $false, $false)
$p.SaveAs($out, 32)
$p.Close()
$pp.Quit()
