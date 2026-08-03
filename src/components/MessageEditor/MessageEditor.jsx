import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import { en } from '@blocknote/core/locales'
import '@blocknote/mantine/style.css'
import '@blocknote/core/fonts/inter.css'
import styles from './MessageEditor.module.css'

const MAX_DIMENSION = 1280
const OUTPUT_QUALITY = 0.82

function readAsDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(blob)
  })
}

function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height))
      const width = Math.max(1, Math.round(img.width * scale))
      const height = Math.max(1, Math.round(img.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Image encoding failed'))
          readAsDataUrl(blob).then(resolve, reject)
        },
        file.type || 'image/jpeg',
        OUTPUT_QUALITY,
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Could not load image'))
    }
    img.src = objectUrl
  })
}

const uploadFile = async (file) => {
  if (!file.type.startsWith('image/')) {
    return readAsDataUrl(file)
  }
  return resizeImage(file)
}

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
    uploadFile,
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
