import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const CustomAlert = ({ 
  visible, 
  title, 
  message, 
  type = 'info', // 'success', 'error', 'warning', 'info'
  onClose,
  showCloseButton = true,
  autoClose = true,
  autoCloseTime = 3000
}) => {
  React.useEffect(() => {
    if (visible && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseTime);
      return () => clearTimeout(timer);
    }
  }, [visible, autoClose, autoCloseTime, onClose]);

  const getIconName = () => {
    switch (type) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#F44336';
      case 'warning':
        return '#FF9800';
      default:
        return '#2196F3';
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#E8F5E8';
      case 'error':
        return '#FFEBEE';
      case 'warning':
        return '#FFF3E0';
      default:
        return '#E3F2FD';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#F44336';
      case 'warning':
        return '#FF9800';
      default:
        return '#2196F3';
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[
          styles.alertContainer,
          { 
            backgroundColor: getBackgroundColor(),
            borderColor: getBorderColor()
          }
        ]}>
          <View style={styles.iconContainer}>
            <MaterialIcons 
              name={getIconName()} 
              size={32} 
              color={getIconColor()} 
            />
          </View>
          
          <View style={styles.contentContainer}>
            {title && (
              <Text style={styles.title}>{title}</Text>
            )}
            {message && (
              <Text style={styles.message}>{message}</Text>
            )}
          </View>

          {showCloseButton && (
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={onClose}
            >
              <MaterialIcons name="close" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
  },
  alertContainer: {
    width: width - 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  message: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});

export default CustomAlert; 