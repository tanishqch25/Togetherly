import Avatar from '../ui/Avatar'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import { useData } from '../../context/useData'

/**
 * The one confirmation for unlinking a partner. Connect and Settings both offer the
 * action, so both must ask the same question with the same consequences.
 */
export default function ConfirmUnlink({ open, onClose, onConfirm }) {
  const { partner } = useData()

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Unlink ${partner.name}?`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>Unlink partner</Button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <Avatar src={partner.avatarUrl} initials={partner.initials} name={partner.name} size="md" ring />
        <p className="text-sm leading-relaxed text-ink-700">
          {partner.name} will no longer see your timeline, and you will not see theirs. Nothing is
          erased — re-link with a new code to pick the timeline back up.
        </p>
      </div>
    </Modal>
  )
}
