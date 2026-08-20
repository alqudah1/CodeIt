import { useParams, Navigate } from 'react-router-dom';
import InteractiveLessonTemplate from '../../components/InteractiveLessonTemplate/InteractiveLessonTemplate';
import { getLessonData } from './lessonRegistry';

/**
 * One route for every lesson.
 *
 * Replaces sixteen near-identical wrapper components and sixteen hardcoded
 * routes. An unknown or non-numeric id sends the student back to the lesson
 * map rather than rendering a blank page — /lesson/99 and /lesson/abc used to
 * fall through to the catch-all.
 */
export default function LessonRoute() {
  const { lessonId } = useParams();
  const lessonData = getLessonData(lessonId);

  if (!lessonData) return <Navigate to="/lessons" replace />;

  // Keyed so switching lessons remounts the template with fresh step state
  // instead of carrying the previous lesson's progress across.
  return <InteractiveLessonTemplate key={lessonData.id} lessonData={lessonData} />;
}
