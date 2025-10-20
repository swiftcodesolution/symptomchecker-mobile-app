import React, { useEffect, useState, useCallback } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { getPersonalContacts, deletePersonalContact } from '../services/firebaseService';
import EditPersonalContactsModal from './EditPersonalContactsModal';

const ContactsDirectory = ({ visible, onClose }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editVisible, setEditVisible] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getPersonalContacts();
      const sorted = (res||[]).slice().sort((a,b)=>String(a?.Name||'').localeCompare(String(b?.Name||'')));
      setList(sorted);
    } catch(e){ console.error(e); Alert.alert('Error','Failed to load contacts.'); }
    finally{ setLoading(false); }
  },[]);

  useEffect(()=>{ if(visible) load(); },[visible, load]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}><Icon name="x" size={22} color="#22577A" /></TouchableOpacity>
          <Text style={styles.title}>Personal Contacts</Text>
          <TouchableOpacity onPress={()=>{ setEditing(null); setEditVisible(true); }}>
            <Icon name="plus-circle" size={22} color="#22577A" />
          </TouchableOpacity>
        </View>

        <View style={styles.tableCard}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.th,{flex:1.2}]}>Name</Text>
            <Text style={[styles.th,{flex:1}]}>Relation</Text>
            <Text style={[styles.th,{flex:1}]}>Contact</Text>
            <Text style={[styles.th,{width:90, textAlign:'center'}]}>Action</Text>
          </View>

          <ScrollView style={{maxHeight:'85%'}}>
            {(list||[]).length===0 && !loading ? (
              <View style={{paddingVertical:18}}><Text style={{textAlign:'center', color:'#666'}}>No contacts added yet</Text></View>
            ) : (
              (list||[]).map((row, idx)=>(
                <View key={row?.id||idx} style={styles.tr}>
                  <Text style={[styles.td,{flex:1.2, fontWeight:'700', color:'#22577A'}]}>{row?.Name || '—'}</Text>
                  <Text style={[styles.td,{flex:1}]}>{row?.Relation || '—'}</Text>
                  <Text style={[styles.td,{flex:1}]}>{row?.ContactNumber || '—'}</Text>
                  <View style={styles.actions}>
                    <TouchableOpacity onPress={()=>{ setEditing(row); setEditVisible(true); }} style={styles.iconBtn}><Icon name="edit" size={16} color="#22577A" /></TouchableOpacity>
                    <TouchableOpacity onPress={()=>{
                      Alert.alert('Delete Contact','Are you sure?',[
                        {text:'Cancel', style:'cancel'},
                        {text:'Delete', style:'destructive', onPress: async ()=>{
                          try{ await deletePersonalContact(row?.id); await load(); }
                          catch(e){ console.error(e); Alert.alert('Error','Delete failed'); }
                        }}
                      ]);
                    }} style={[styles.iconBtn,{backgroundColor:'#FFF0F0'}]}><Icon name="trash-2" size={16} color="#dc3545" /></TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>

      <EditPersonalContactsModal
        visible={editVisible}
        onClose={()=>setEditVisible(false)}
        currentContact={editing}
        onSave={()=>{ setEditVisible(false); load(); }}
      />
    </Modal>
  );
};

export default ContactsDirectory;

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:'#F7F6F2' },
  header:{ paddingHorizontal:16, paddingVertical:14, flexDirection:'row', alignItems:'center', justifyContent:'space-between', borderBottomWidth:1, borderBottomColor:'#E5E4DE', backgroundColor:'#FFF' },
  title:{ fontSize:18, fontWeight:'bold', color:'#22577A' },
  tableCard:{ margin:10, backgroundColor:'#E9E7E1', borderRadius:16, padding:12, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.08, shadowRadius:6, elevation:2 },
  tableHeaderRow:{ flexDirection:'row', backgroundColor:'#D7F9F1', paddingVertical:8, paddingHorizontal:10, borderRadius:10, marginBottom:6 },
  th:{ fontWeight:'bold', color:'#22577A' },
  tr:{ flexDirection:'row', backgroundColor:'#fff', paddingVertical:10, paddingHorizontal:10, borderRadius:10, marginBottom:6, alignItems:'center' },
  td:{ color:'#444' },
  actions:{ width:90, justifyContent:'center', alignItems:'center', flexDirection:'row', gap:8 },
  iconBtn:{ padding:8, backgroundColor:'rgba(34,87,122,0.08)', borderRadius:10 },
});
