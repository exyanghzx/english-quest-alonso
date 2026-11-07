param(
  [string]$OutputDirectory = (Join-Path $PSScriptRoot '..\dist\audio')
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech

$clips = @(
  @{ File='number-00.wav'; Text='zero' }, @{ File='number-01.wav'; Text='one' },
  @{ File='number-02.wav'; Text='two' }, @{ File='number-03.wav'; Text='three' },
  @{ File='number-04.wav'; Text='four' }, @{ File='number-05.wav'; Text='five' },
  @{ File='number-06.wav'; Text='six' }, @{ File='number-07.wav'; Text='seven' },
  @{ File='number-08.wav'; Text='eight' }, @{ File='number-09.wav'; Text='nine' },
  @{ File='number-10.wav'; Text='ten' }, @{ File='number-11.wav'; Text='eleven' },
  @{ File='number-12.wav'; Text='twelve' }, @{ File='number-13.wav'; Text='thirteen' },
  @{ File='number-14.wav'; Text='fourteen' }, @{ File='number-15.wav'; Text='fifteen' },
  @{ File='number-16.wav'; Text='sixteen' }, @{ File='number-17.wav'; Text='seventeen' },
  @{ File='number-18.wav'; Text='eighteen' }, @{ File='number-19.wav'; Text='nineteen' },
  @{ File='number-20.wav'; Text='twenty' }, @{ File='number-21.wav'; Text='twenty-one' },
  @{ File='pronoun-i.wav'; Text='I' }, @{ File='pronoun-you.wav'; Text='you' },
  @{ File='pronoun-he.wav'; Text='he' }, @{ File='pronoun-she.wav'; Text='she' },
  @{ File='pronoun-it.wav'; Text='it' }, @{ File='pronoun-we.wav'; Text='we' },
  @{ File='pronoun-they.wav'; Text='they' },
  @{ File='i-am-alonso.wav'; Text='I am Alonso.' },
  @{ File='you-are-my-friend.wav'; Text='You are my friend.' },
  @{ File='she-is-from-peru.wav'; Text='She is from Peru.' },
  @{ File='dialogue-maya.wav'; Text='Hi! I am Maya. What is your name?' },
  @{ File='dialogue-alonso.wav'; Text='I am Alonso. I am from Peru.' },
  @{ File='are-you-21.wav'; Text='Are you twenty-one years old?' },
  @{ File='yes-i-am.wav'; Text='Yes, I am.' },
  @{ File='i-am-21.wav'; Text='I am twenty-one years old.' },
  @{ File='are-you-a-student.wav'; Text='Are you a student?' },
  @{ File='i-am-not-tired.wav'; Text='I am not tired.' },
  @{ File='they-are-my-friends.wav'; Text='They are my friends.' },
  @{ File='repeat-that.wav'; Text='Could you repeat that, please?' },
  @{ File='speak-slowly.wav'; Text='Please speak more slowly.' },
  @{ File='not-understand-yet.wav'; Text='I do not understand yet.' },
  @{ File='voice-test.wav'; Text='I. I am Alonso. You are my friend.' }
)

New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$englishVoice = $synth.GetInstalledVoices() |
  Where-Object { $_.Enabled -and $_.VoiceInfo.Culture.Name -eq 'en-US' } |
  Select-Object -First 1

if (-not $englishVoice) {
  throw 'No enabled en-US Windows voice is installed.'
}

$synth.SelectVoice($englishVoice.VoiceInfo.Name)
$synth.Rate = -1
$synth.Volume = 100

try {
  foreach ($clip in $clips) {
    $path = Join-Path $OutputDirectory $clip.File
    $synth.SetOutputToWaveFile($path)
    $synth.Speak($clip.Text)
    $synth.SetOutputToNull()
  }
} finally {
  $synth.Dispose()
}

Write-Output "Generated $($clips.Count) English clips with $($englishVoice.VoiceInfo.Name)."
