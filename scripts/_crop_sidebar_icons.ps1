Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Image]::FromFile("C:\Users\UsuarioPC\Downloads\WhatsApp Image 2026-08-29 at 3.40.45 PM.jpeg")
$outDir = "C:\Users\UsuarioPC\Desktop\Claude Dev\friendlyteaching-app\public\sidebar-icons"
$cellW = 400

function Crop-Icon {
  param($col, $name, $y, $size)
  $x = [int](($cellW - $size) / 2 + $col * $cellW)
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $srcRect = New-Object System.Drawing.Rectangle $x, $y, $size, $size
  $dstRect = New-Object System.Drawing.Rectangle 0, 0, $size, $size
  $g.DrawImage($src, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
  $bmp.Save("$outDir\$name.png", [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
  Write-Output "$name -> ($x,$y ${size}x${size})"
}

# Coords per-cell. La grilla del composite no es uniforme: col 3
# (Importar lecciones label de 2 lineas) empuja las filas siguientes de
# esa columna ~70px hacia abajo. Medido desde probes col1 y col3:
#
#           col 0        col 1        col 2        col 3
# Row 0     y=20 s=340   y=20 s=340   y=20 s=340   y=20 s=340
# Row 1     y=430 s=310  y=430 s=310  y=430 s=310  y=500 s=310
# Row 2     y=810 s=320  y=810 s=320  y=810 s=320  y=940 s=310
# Row 3     -            y=1230 s=310 y=1230 s=310 -

# Coords finales medidas per-tile:
#   Row 0: tile y=20-360, label 380-500
#   Row 1: tile y=520-820, label 830-900
#   Row 2: tile y=920-1210, label 1220-1290
#   Row 3: tile y=1310-1560, label 1570-1600
# La grilla ES uniforme (400px por row) — mi confusion previa era
# mirar por columnas de diferentes labels.

# Sizes calibrados empiricamente hasta que NO se ve label.
# Row 0 puede ser 340 porque no hay label arriba.
# Rows 1-3 shrinkean para no morder ni el label de arriba ni el propio.

Crop-Icon 1 'co-work'            20   340
Crop-Icon 2 'lecciones'          20   340
Crop-Icon 3 'importar-lecciones' 20   340
Crop-Icon 0 'planner'            525  260
Crop-Icon 1 'tareas'             525  260
Crop-Icon 2 'palabra-dia'        525  260
Crop-Icon 3 'placement-test'     525  260
Crop-Icon 0 'leads'              910  215
Crop-Icon 1 'recordatorios'      910  215
Crop-Icon 2 'facturacion'        910  215
Crop-Icon 3 'actividades'        910  215
Crop-Icon 1 'mi-perfil'          1300 200
Crop-Icon 2 'cerrar-sesion'      1300 200

$src.Dispose()
Write-Output "done"
