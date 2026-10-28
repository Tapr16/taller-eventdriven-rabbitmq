param([string]$in, [string]$out)
$w = New-Object -ComObject Word.Application
$w.Visible = $false
$d = $w.Documents.Open($in, $false, $true)
$d.SaveAs([ref]$out, [ref]17)
$d.Close([ref]0)
$w.Quit()
