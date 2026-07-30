import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Share, Clipboard } from 'react-native';
import { QrCodeDisplay } from './QrCodeDisplay';
import { cache } from '../lib/cache';
import { haptics } from '../lib/haptics';

interface ShareIdModalProps {
  visible: boolean;
  onClose: () => void;
  did: string;
  holderName: string;
  credentialId?: string;
}

export function ShareIdModal({ visible, onClose, did, holderName, credentialId }: ShareIdModalProps) {
  const shareData = credentialId
    ? JSON.stringify({ type: 'credential', vcId: credentialId, did })
    : JSON.stringify({ type: 'did', did });

  const handleCopyDid = async () => {
    haptics.light();
    await Clipboard.setString(did);
    cache.addShareHistory({ method: 'copy', credentialId, credentialName: holderName });
  };

  const handleShare = async () => {
    haptics.light();
    try {
      await Share.share({
        message: `RefugeeID Identity\n\nHolder: ${holderName}\nDID: ${did}`,
        title: 'Share Identity',
      });
      cache.addShareHistory({ method: 'share', credentialId, credentialName: holderName });
    } catch {}
  };

  const handleShareCode = async () => {
    if (!credentialId) return;
    haptics.light();
    try {
      await Share.share({
        message: `My RefugeeID credential code: ${credentialId}\nHolder: ${holderName}\nDID: ${did}`,
        title: 'Share Credential',
      });
      cache.addShareHistory({ method: 'code', credentialId, credentialName: holderName });
    } catch {}
  };

  const handleShowQr = () => {
    haptics.selection();
    cache.addShareHistory({ method: 'qr', credentialId, credentialName: holderName });
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>{'\u2715'}</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Share Identity</Text>
          <Text style={styles.subtitle}>Show this QR code to a verifier</Text>

          <TouchableOpacity onPress={handleShowQr}>
            <View style={styles.qrContainer}>
              <QrCodeDisplay value={shareData} size={200} />
            </View>
          </TouchableOpacity>

          <View style={styles.holderInfo}>
            <Text style={styles.holderName}>{holderName}</Text>
            <Text style={styles.holderDid} numberOfLines={1}>{did}</Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleCopyDid}>
              <Text style={styles.actionIcon}>{'\ud83d\udccb'}</Text>
              <Text style={styles.actionText}>Copy DID</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
              <Text style={styles.actionIcon}>{'\ud83d\udce4'}</Text>
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>

            {credentialId && (
              <TouchableOpacity style={styles.actionBtn} onPress={handleShareCode}>
                <Text style={styles.actionIcon}>{'\ud83d\udd11'}</Text>
                <Text style={styles.actionText}>Share Code</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  content: { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 340, alignItems: 'center' },
  closeBtn: { position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  closeBtnText: { fontSize: 16, color: '#64748b', fontWeight: '600' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginTop: 8 },
  subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 4, marginBottom: 20 },
  qrContainer: { marginBottom: 16 },
  holderInfo: { alignItems: 'center', marginBottom: 20 },
  holderName: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  holderDid: { fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', marginTop: 4, maxWidth: 260 },
  actions: { flexDirection: 'row', gap: 12, width: '100%' },
  actionBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  actionIcon: { fontSize: 20, marginBottom: 4 },
  actionText: { fontSize: 12, fontWeight: '600', color: '#334155' },
});
