// The studio's code tab without the coloured editor: what opens when that
// editor's file is stopped on the way (a school filter), and what the
// small-files version of CodeIt always uses.
import PlainEditor from '../../components/PlainEditor';

export default function PlainCodeEditor({ value, onChange }) {
  return <PlainEditor value={value} onChange={onChange} height="380px" indent="  " label="Your project's code" />;
}
