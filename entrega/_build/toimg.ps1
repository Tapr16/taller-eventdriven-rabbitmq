param([string]$in, [string]$outdir)
$pp = New-Object -ComObject PowerPoint.Application
$p = $pp.Presentations.Open($in, $true, $false, $false)
$p.Export($outdir, "PNG", 1280, 720)
$p.Close()
$pp.Quit()
