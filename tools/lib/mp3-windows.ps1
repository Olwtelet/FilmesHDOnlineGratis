# WAV -> MP3 com o codificador do Windows (Media Foundation, "MP3 Encoder ACM Wrapper MFT"), sem instalar nada.
# Windows PowerShell 5.1:
#   powershell -NoProfile -ExecutionPolicy Bypass -File tools\lib\mp3-windows.ps1 -Entrada C:\caminho\som.wav -Saida C:\caminho\som.mp3 [-Taxa 48000] [-Kbps 128] [-Canais 2]
# Usado por tools/gerar-sons.mjs.
# Testado em 2026-11-10: 48000/128/2 e 44100/96/1 geram MP3 MPEG1 Layer III CBR válidos (ID3v2.3 com TFLT e COMM iTunSMPB,
# sem cabeçalho Xing/LAME: o atraso do codificador, 672 amostras, não é descontado pelo navegador).
param(
  [Parameter(Mandatory = $true)][string]$Entrada,
  [Parameter(Mandatory = $true)][string]$Saida,
  [int]$Taxa = 48000,
  [int]$Kbps = 128,
  [int]$Canais = 2
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$metodos = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 }
$opT = $metodos | Where-Object { $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' } | Select-Object -First 1
$acaoProg = $metodos | Where-Object { $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncActionWithProgress`1' } | Select-Object -First 1
function Esperar($op, [Type]$tipo) { $t = $opT.MakeGenericMethod($tipo).Invoke($null, @($op)); $t.Wait(-1) | Out-Null; $t.Result }
[Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime] | Out-Null
[Windows.Storage.StorageFolder, Windows.Storage, ContentType = WindowsRuntime] | Out-Null
[Windows.Media.Transcoding.MediaTranscoder, Windows.Media.Transcoding, ContentType = WindowsRuntime] | Out-Null
[Windows.Media.MediaProperties.MediaEncodingProfile, Windows.Media.MediaProperties, ContentType = WindowsRuntime] | Out-Null

$Entrada = (Resolve-Path $Entrada).Path
$pastaSaida = Split-Path -Parent ([System.IO.Path]::GetFullPath($Saida))
$nomeSaida = Split-Path -Leaf $Saida
$arqEntrada = Esperar ([Windows.Storage.StorageFile]::GetFileFromPathAsync($Entrada)) ([Windows.Storage.StorageFile])
$pasta = Esperar ([Windows.Storage.StorageFolder]::GetFolderFromPathAsync($pastaSaida)) ([Windows.Storage.StorageFolder])
$arqSaida = Esperar ($pasta.CreateFileAsync($nomeSaida, [Windows.Storage.CreationCollisionOption]::ReplaceExisting)) ([Windows.Storage.StorageFile])
$perfil = [Windows.Media.MediaProperties.MediaEncodingProfile]::CreateMp3([Windows.Media.MediaProperties.AudioEncodingQuality]::High)
$perfil.Audio.SampleRate = $Taxa
$perfil.Audio.Bitrate = $Kbps * 1000
$perfil.Audio.ChannelCount = $Canais
$tc = New-Object Windows.Media.Transcoding.MediaTranscoder
$prep = Esperar ($tc.PrepareFileTranscodeAsync($arqEntrada, $arqSaida, $perfil)) ([Windows.Media.Transcoding.PrepareTranscodeResult])
if (-not $prep.CanTranscode) { throw "não codifica: $($prep.FailureReason)" }
$t = $acaoProg.MakeGenericMethod([double]).Invoke($null, @($prep.TranscodeAsync()))
$t.Wait(-1) | Out-Null
"ok $Saida $((Get-Item $Saida).Length) bytes"
