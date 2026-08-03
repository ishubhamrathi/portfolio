import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import { en } from '@blocknote/core/locales'
import '@blocknote/mantine/style.css'
import '@blocknote/core/fonts/inter.css'
import styles from './MessageEditor.module.css'

export default function MessageEditor({ onChange, placeholder = 'Tell me what you need!' }) {
  const editor = useCreateBlockNote({
    dictionary: {
      ...en,
      placeholders: {
        ...en.placeholders,
        default: placeholder,
        heading: placeholder,
      },
    },
  })

  return (
    <div className={styles.wrap}>
      <BlockNoteView
        editor={editor}
        theme="dark"
        className={styles.editor}
        onChange={() => onChange(editor.blocksToMarkdownLossy(editor.document))}
      />
    </div>
  )
}
