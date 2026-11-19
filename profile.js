(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const area = params.get('area') === 'pro' ? 'pro' : 'basic';
  const PHOTO_BUCKET = 'student-profile-photos';
  const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
  document.body.dataset.area = area;

  let currentUserId = null;
  let currentPhotoPath = null;
  let photoBusy = false;

  const setText = (id, value) => {
    const el = $(id);
    if (el) el.textContent = value == null || value === '' ? 'Not available' : String(value);
  };
  const formatDate = value => {
    if (!value) return 'Not available';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleDateString(undefined, {year:'numeric', month:'short', day:'numeric'});
  };
  const setStatus = (message, type='') => {
    const el = $('profile-status');
    if (!el) return;
    el.textContent = message;
    el.className = 'status' + (type ? ' ' + type : '');
  };
  const setPhotoStatus = (message, type='') => {
    const el = $('profile-photo-status');
    if (!el) return;
    el.textContent = message;
    el.className = 'profile-photo-status' + (type ? ' ' + type : '');
  };
  const setPhotoBusy = busy => {
    photoBusy = busy;
    $('profile-photo-select').disabled = busy;
    $('profile-photo-remove').disabled = busy;
    $('profile-photo-select').textContent = busy ? 'Please wait…' : (currentPhotoPath ? 'Change profile picture' : '＋ Add profile picture');
  };
  const showInitial = initial => {
    $('profile-avatar-initial').textContent = initial;
    $('profile-avatar-initial').hidden = false;
    $('profile-avatar-image').hidden = true;
    $('profile-avatar-image').removeAttribute('src');
    $('profile-photo-remove').hidden = true;
    currentPhotoPath = null;
    $('profile-photo-select').textContent = '＋ Add profile picture';
  };
  const showPhoto = url => {
    $('profile-avatar-image').src = url;
    $('profile-avatar-image').hidden = false;
    $('profile-avatar-initial').hidden = true;
    $('profile-photo-remove').hidden = false;
    $('profile-photo-select').textContent = 'Change profile picture';
  };
  const setAreaLinks = () => {
    $('profile-back').href = area === 'pro' ? 'pro.html' : 'basic.html';
    $('profile-settings').href = `settings.html?area=${area}`;
    $('profile-area-label').textContent = area === 'pro' ? 'PRO LEARNING' : 'BASIC LEARNING';
    $('profile-area').textContent = area === 'pro' ? 'Pro Learning' : 'Basic Learning';
    $('profile-membership-badge').textContent = area === 'pro' ? '✦ Pro Learning' : 'Basic Learning';
  };

  async function findCurrentPhoto(sb, userId) {
    const {data, error} = await sb.storage.from(PHOTO_BUCKET).list(userId, {limit: 20});
    if (error) {
      // A missing bucket/policy should not prevent the rest of the profile from loading.
      console.warn('Profile picture storage is not ready:', error.message);
      setPhotoStatus('Profile picture storage needs to be set up before you can upload.');
      return null;
    }
    const file = (data || []).find(item => /^profile-avatar\.(jpg|png|webp)$/i.test(item.name));
    if (!file) return null;
    const path = `${userId}/${file.name}`;
    const {data: signed, error: signedError} = await sb.storage.from(PHOTO_BUCKET).createSignedUrl(path, 3600);
    if (signedError || !signed?.signedUrl) {
      console.warn('Profile picture preview could not be created:', signedError?.message);
      return null;
    }
    return {path, url: signed.signedUrl};
  }

  async function uploadPhoto() {
    if (photoBusy || !currentUserId) return;
    const file = $('profile-photo-file').files?.[0];
    $('profile-photo-file').value = '';
    if (!file) return;
    const allowed = {'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
    const extension = allowed[file.type];
    if (!extension) {
      setPhotoStatus('Choose a JPG, PNG or WebP image.', 'error');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoStatus('The image must be 2 MB or smaller.', 'error');
      return;
    }

    const sb = MSS.client();
    const path = `${currentUserId}/profile-avatar.${extension}`;
    setPhotoBusy(true);
    setPhotoStatus('Uploading your picture…');
    try {
      const {error: uploadError} = await sb.storage.from(PHOTO_BUCKET).upload(path, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: true
      });
      if (uploadError) throw uploadError;

      // Remove an older extension only after the new upload has succeeded.
      const {data: files} = await sb.storage.from(PHOTO_BUCKET).list(currentUserId, {limit:20});
      const oldPaths = (files || [])
        .filter(item => /^profile-avatar\.(jpg|png|webp)$/i.test(item.name) && item.name !== `profile-avatar.${extension}`)
        .map(item => `${currentUserId}/${item.name}`);
      if (oldPaths.length) {
        const {error: deleteError} = await sb.storage.from(PHOTO_BUCKET).remove(oldPaths);
        if (deleteError) console.warn('An older profile image could not be cleared:', deleteError.message);
      }

      const {data: signed, error: signedError} = await sb.storage.from(PHOTO_BUCKET).createSignedUrl(path, 3600);
      if (signedError || !signed?.signedUrl) throw signedError || new Error('The uploaded image could not be displayed.');
      currentPhotoPath = path;
      showPhoto(signed.signedUrl);
      setPhotoStatus('Your picture is updated. Other students can see it only if you enable Profile picture in Settings.');
    } catch (error) {
      console.error('Profile picture upload failed:', error);
      setPhotoStatus(error.message || 'The picture could not be uploaded. Please try again.', 'error');
    } finally {
      setPhotoBusy(false);
    }
  }

  async function removePhoto() {
    if (photoBusy || !currentUserId || !currentPhotoPath) return;
    if (!window.confirm('Remove your profile picture?')) return;
    const sb = MSS.client();
    setPhotoBusy(true);
    setPhotoStatus('Removing your picture…');
    try {
      const {error} = await sb.storage.from(PHOTO_BUCKET).remove([currentPhotoPath]);
      if (error) throw error;
      const name = $('profile-name').textContent.trim();
      showInitial((name.charAt(0) || 'L').toUpperCase());
      setPhotoStatus('Your profile picture has been removed.');
    } catch (error) {
      console.error('Profile picture removal failed:', error);
      setPhotoStatus(error.message || 'The picture could not be removed. Please try again.', 'error');
    } finally {
      setPhotoBusy(false);
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    setAreaLinks();
    $('profile-photo-select').addEventListener('click', () => {
      if (!photoBusy) $('profile-photo-file').click();
    });
    $('profile-photo-file').addEventListener('change', () => void uploadPhoto());
    $('profile-photo-remove').addEventListener('click', () => void removePhoto());

    try {
      if (!window.MSS || !MSS.client()) throw new Error('The learning system could not connect. Please refresh and try again.');
      const result = await MSS.requireArea(area);
      if (!result) return;
      if (result.error && area === 'pro' && !result.privileged) {
        setStatus('We could not verify your Pro membership. Please return to your learning area and try again.', 'error');
        return;
      }
      const user = result.user;
      currentUserId = user.id;
      const profile = result.profile || {};
      const name = MSS.displayName(profile, user);
      const initial = (name.trim().charAt(0) || 'L').toUpperCase();
      const schoolName = profile.school_id
        ? await (async () => {
            const {data, error} = await MSS.client().from('schools').select('school_name').eq('id', profile.school_id).maybeSingle();
            if (error) console.warn('School name could not be loaded:', error.message);
            return data?.school_name || 'Selected school';
          })()
        : 'Not selected';

      setText('profile-name', name);
      setText('profile-subtitle', 'Your private student profile');
      showInitial(initial);
      setText('profile-student-number', profile.student_number || 'Pending confirmation');
      setText('profile-school', schoolName);
      setText('profile-detail-name', name);
      setText('profile-detail-number', profile.student_number || 'Pending confirmation');
      setText('profile-detail-school', schoolName);
      setText('profile-email', user.email || 'Not available');
      setText('profile-created', formatDate(user.created_at));

      if (area === 'pro' && result.membership?.active) {
        $('profile-membership-badge').textContent = '✦ Pro Learning';
      } else if (result.privileged && area === 'pro') {
        $('profile-membership-badge').textContent = 'Pro preview';
      }

      $('profile-content').hidden = false;
      setStatus('Your profile is ready.');

      const photo = await findCurrentPhoto(MSS.client(), user.id);
      if (photo) {
        currentPhotoPath = photo.path;
        showPhoto(photo.url);
        setPhotoStatus('Your picture is private unless you enable Profile picture in Settings.');
      } else if (!$('profile-photo-status').textContent.includes('needs to be set up')) {
        setPhotoStatus('Other students can see it only if you enable Profile picture in Settings.');
      }
    } catch (error) {
      console.error('Profile loading failed:', error);
      setStatus(error.message || 'We could not load your profile. Please refresh and try again.', 'error');
    }
  });
})();
