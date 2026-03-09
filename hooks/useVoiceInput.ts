import { useState, useRef, useCallback } from 'react';
import { useAudioRecorder, AudioModule, RecordingPresets } from 'expo-audio';
import { transcribeAudio } from '../services/elevenlabs-stt';

type VoiceInputState = 'idle' | 'recording' | 'transcribing';

export function useVoiceInput(onTranscription: (text: string) => void) {
  const [state, setState] = useState<VoiceInputState>('idle');
  const [error, setError] = useState<string | null>(null);
  const onTranscriptionRef = useRef(onTranscription);
  onTranscriptionRef.current = onTranscription;

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        setError('Microphone permission denied');
        return;
      }

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setState('recording');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start recording';
      setError(message);
    }
  }, [audioRecorder]);

  const stopRecording = useCallback(async () => {
    setState('transcribing');
    try {
      await audioRecorder.stop();

      const uri = audioRecorder.uri;
      if (!uri) throw new Error('No recording URI available after stop');

      const text = await transcribeAudio(uri);
      onTranscriptionRef.current(text);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Transcription failed';
      setError(message);
    } finally {
      setState('idle');
    }
  }, [audioRecorder]);

  const toggleRecording = useCallback(() => {
    if (state === 'recording') stopRecording();
    else if (state === 'idle') startRecording();
  }, [state, startRecording, stopRecording]);

  return {
    state,
    error,
    isRecording: state === 'recording',
    isTranscribing: state === 'transcribing',
    toggleRecording,
  };
}
