// components/InsuranceDirectory.js
import React, { useEffect, useState, useCallback } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { getInsuranceDetails, deleteInsuranceDetails } from '../services/firebaseService';
import EditInsuranceModal from './EditInsuranceModal';

const InsuranceDirectory = ({ visible, onClose }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editVisible, setEditVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getInsuranceDetails();
      const sorted = (res || []).slice().sort((a, b) =>
        String(a?.companyName || '').localeCompare(String(b?.companyName || ''))
      );
      setList(sorted);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to load insurance.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  const onAdd = () => { setEditingItem(null); setEditVisible(true); };
  const onEdit = (row) => { setEditingItem(row); setEditVisible(true); };
  const onDelete = (id) => {
    Alert.alert('Delete Insurance', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await deleteInsuranceDetails(id); await load(); }
        catch (e) { console.error(e); Alert.alert('Error','Delete failed'); }
      } }
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}><Icon name="x" size={22} color="#22577A" /></TouchableOpacity>
          <Text style={styles.title}>Insurance</Text>
          <TouchableOpacity onPress={onAdd}><Icon name="plus-circle" size={22} color="#22577A" /></TouchableOpacity>
        </View>

        <View style={styles.tableCard}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.th, {flex:1.2}]}>Company</Text>
            <Text style={[styles.th, {flex:1}]}>Policy No</Text>
            <Text style={[styles.th, {flex:1}]}>Issue</Text>
            <Text style={[styles.th, {flex:1}]}>Expiry</Text>
            {/* <Text style={[styles.th, {width:90, textAlign:'center'}]}>Action</Text> */}
          </View>

          <ScrollView style={{maxHeight:'85%'}}>
            {(list||[]).length === 0 && !loading ? (
              <View style={{paddingVertical:18}}><Text style={{textAlign:'center', color:'#666'}}>No insurance added yet</Text></View>
            ) : (
              (list||[]).map((row, idx) => (
                <View key={row?.id || idx} style={styles.tr}>
                  <Text style={[styles.td, {flex:1.2, fontWeight:'700', color:'#22577A'}]}>{row?.companyName || '—'}</Text>
                  <Text style={[styles.td, {flex:1}]}>{row?.policyNo || '—'}</Text>
                  <Text style={[styles.td, {flex:1}]}>{row?.issueDate || '—'}</Text>
                  <Text style={[styles.td, {flex:1}]}>{row?.expiryDate || '—'}</Text>
                  {/* <View style={styles.actions}>
                    <TouchableOpacity onPress={() => onEdit(row)} style={styles.iconBtn}><Icon name="edit" size={16} color="#22577A" /></TouchableOpacity>
                    <TouchableOpacity onPress={() => onDelete(row?.id)} style={[styles.iconBtn,{backgroundColor:'#FFF0F0'}]}><Icon name="trash-2" size={16} color="#dc3545" /></TouchableOpacity>
                  </View> */}
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>

      <EditInsuranceModal
        visible={editVisible}
        onClose={() => setEditVisible(false)}
        currentInsurance={editingItem}
        onSave={() => { setEditVisible(false); load(); }}
      />
    </Modal>
  );
};

export default InsuranceDirectory;

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:'#F7F6F2' },
  header:{ paddingHorizontal:16, paddingVertical:14, flexDirection:'row', alignItems:'center', justifyContent:'space-between', borderBottomWidth:1, borderBottomColor:'#E5E4DE', backgroundColor:'#FFF' },
  title:{ fontSize:18, fontWeight:'bold', color:'#22577A' },
  tableCard:{ margin:10, backgroundColor:'#E9E7E1', borderRadius:16, padding:12, shadowColor:'#000', shadowOffset:{width:0, height:2}, shadowOpacity:0.08, shadowRadius:6, elevation:2 },
  tableHeaderRow:{ flexDirection:'row', backgroundColor:'#D7F9F1', paddingVertical:8, paddingHorizontal:10, borderRadius:10, marginBottom:6 },
  th:{ fontWeight:'bold', color:'#22577A' },
  tr:{ flexDirection:'row', backgroundColor:'#fff', paddingVertical:10, paddingHorizontal:10, borderRadius:10, marginBottom:6, alignItems:'center' },
  td:{ color:'#444' },
  actions:{ width:90, justifyContent:'center', alignItems:'center', flexDirection:'row', gap:8 },
  iconBtn:{ padding:8, backgroundColor:'rgba(34,87,122,0.08)', borderRadius:10 },
});
