import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { transcribeAudio } from '../services/elevenlabs-stt';

type VoiceInputState = 'idle' | 'recording' | 'transcribing';

export function useVoiceInput(onTranscription: (text: string) => void) {
  const [state, setState] = useState<VoiceInputState>('idle');
  const [error, setError] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const startRecording = useCallback(async () => {
    setError(null);

    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        setError('Microphone permission denied');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );

      recordingRef.current = recording;
      setState('recording');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start recording';
      setError(message);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    const recording = recordingRef.current;
    if (!recording) return;

    setState('transcribing');

    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recording.getURI();
      recordingRef.current = null;

      if (!uri) {
        throw new Error('No recording URI available');
      }

      const text = await transcribeAudio(uri);
      onTranscription(text);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Transcription failed';
      setError(message);
    } finally {
      setState('idle');
    }
  }, [onTranscription]);

  const toggleRecording = useCallback(() => {
    if (state === 'recording') {
      stopRecording();
    } else if (state === 'idle') {
      startRecording();
    }
  }, [state, startRecording, stopRecording]);

  return {
    state,
    error,
    isRecording: state === 'recording',
    isTranscribing: state === 'transcribing',
    toggleRecording,
  };
}
