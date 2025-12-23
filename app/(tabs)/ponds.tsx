import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import api from "@/services/api";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface FishType {
  id: number;
  name: string;
  description: string;
}

interface Pond {
  id: number;
  name: string;
  fish_count: number;
  status: "active" | "inactive";
  registered_at: string;
  fish_type_id: number;
  fish_type?: FishType;
}

export default function PondsScreen() {
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [fishTypes, setFishTypes] = useState<FishType[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Add Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [newPondName, setNewPondName] = useState("");
  const [newPondFishCount, setNewPondFishCount] = useState("");
  const [newPondFishTypeId, setNewPondFishTypeId] = useState<number | null>(null);

  // Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedPond, setSelectedPond] = useState<Pond | null>(null);
  const [editPondName, setEditPondName] = useState("");
  const [editPondFishCount, setEditPondFishCount] = useState("");
  const [editPondStatus, setEditPondStatus] = useState<"active" | "inactive">("active");
  const [editPondFishTypeId, setEditPondFishTypeId] = useState<number | null>(null);

  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pondsRes, fishTypesRes] = await Promise.all([
        api.get("/ponds"),
        api.get("/fish-types")
      ]);
      setPonds(pondsRes.data);
      setFishTypes(fishTypesRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPond = async () => {
    if (!newPondName || !newPondFishCount || !newPondFishTypeId) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      const response = await api.post("/ponds", {
        name: newPondName,
        fish_count: parseInt(newPondFishCount),
        status: "active",
        fish_type_id: newPondFishTypeId,
      });
      setPonds([response.data, ...ponds]);
      setModalVisible(false);
      setNewPondName("");
      setNewPondFishCount("");
      setNewPondFishTypeId(null);
    } catch (error) {
      Alert.alert("Error", "Failed to add pond");
    }
  };

  const openEditModal = (pond: Pond) => {
    setSelectedPond(pond);
    setEditPondName(pond.name);
    setEditPondFishCount(pond.fish_count.toString());
    setEditPondStatus(pond.status);
    setEditPondFishTypeId(pond.fish_type_id);
    setEditModalVisible(true);
  };

  const handleUpdatePond = async () => {
    if (!selectedPond || !editPondName || !editPondFishCount || !editPondFishTypeId) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      const response = await api.put(`/ponds/${selectedPond.id}`, {
        name: editPondName,
        fish_count: parseInt(editPondFishCount),
        status: editPondStatus,
        fish_type_id: editPondFishTypeId,
      });

      setPonds(
        ponds.map((p) => (p.id === selectedPond.id ? response.data : p))
      );
      setEditModalVisible(false);
      setSelectedPond(null);
    } catch (error) {
      Alert.alert("Error", "Failed to update pond");
    }
  };

  const handleDeletePond = () => {
    if (!selectedPond) return;

    Alert.alert("Delete Pond", "Are you sure you want to delete this pond?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/ponds/${selectedPond.id}`);
            setPonds(ponds.filter((p) => p.id !== selectedPond.id));
            setEditModalVisible(false);
            setSelectedPond(null);
          } catch (error) {
            Alert.alert("Error", "Failed to delete pond");
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Pond }) => (
    <TouchableOpacity
      onPress={() => openEditModal(item)}
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>
          {item.name}
        </Text>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.status === "active" ? theme.secondary : theme.icon,
            },
          ]}
        >
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <IconSymbol name="fish.fill" size={16} color={theme.primary} />
          <Text style={[styles.infoText, { color: theme.text }]}>
            {" "}
            {item.fish_count} {item.fish_type?.name || 'Fish'}
          </Text>
        </View>
        <Text style={[styles.dateText, { color: theme.icon }]}>
          Registered: {new Date(item.registered_at).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderFishTypeSelector = (
    selectedId: number | null,
    onSelect: (id: number) => void
  ) => (
    <View style={styles.selectorContainer}>
      <Text style={[styles.label, { color: theme.text }]}>Fish Type:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
        {fishTypes.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.chip,
              selectedId === type.id
                ? { backgroundColor: theme.primary }
                : { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border },
            ]}
            onPress={() => onSelect(type.id)}
          >
            <Text
              style={[
                styles.chipText,
                selectedId === type.id ? { color: "#fff" } : { color: theme.text },
              ]}
            >
              {type.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          My Ponds
        </Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <IconSymbol name="plus.circle.fill" size={32} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={theme.primary}
          style={{ marginTop: 20 }}
        />
      ) : (
        <FlatList
          data={ponds}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.icon }]}>
                No ponds found. Add one!
              </Text>
            </View>
          }
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View
              style={[
                styles.modalContent,
                { backgroundColor: theme.background },
              ]}
            >
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Add New Pond
              </Text>

              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.card,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="Pond Name"
                placeholderTextColor={theme.icon}
                value={newPondName}
                onChangeText={setNewPondName}
              />

              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.card,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="Fish Count"
                placeholderTextColor={theme.icon}
                value={newPondFishCount}
                onChangeText={setNewPondFishCount}
                keyboardType="numeric"
              />

              {renderFishTypeSelector(newPondFishTypeId, setNewPondFishTypeId)}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: theme.icon }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    { backgroundColor: theme.primary },
                  ]}
                  onPress={handleAddPond}
                >
                  <Text style={styles.buttonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View
              style={[
                styles.modalContent,
                { backgroundColor: theme.background },
              ]}
            >
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Edit Pond
              </Text>

              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.card,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="Pond Name"
                placeholderTextColor={theme.icon}
                value={editPondName}
                onChangeText={setEditPondName}
              />

              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.card,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="Fish Count"
                placeholderTextColor={theme.icon}
                value={editPondFishCount}
                onChangeText={setEditPondFishCount}
                keyboardType="numeric"
              />

              {renderFishTypeSelector(editPondFishTypeId, setEditPondFishTypeId)}

              <View style={styles.statusContainer}>
                <Text style={[styles.label, { color: theme.text }]}>
                  Status:
                </Text>
                <View style={styles.statusButtons}>
                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      editPondStatus === "active" && {
                        backgroundColor: theme.secondary,
                      },
                    ]}
                    onPress={() => setEditPondStatus("active")}
                  >
                    <Text
                      style={[
                        styles.statusButtonText,
                        editPondStatus === "active"
                          ? { color: "#fff" }
                          : { color: theme.text },
                      ]}
                    >
                      Active
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      editPondStatus === "inactive" && {
                        backgroundColor: theme.icon,
                      },
                    ]}
                    onPress={() => setEditPondStatus("inactive")}
                  >
                    <Text
                      style={[
                        styles.statusButtonText,
                        editPondStatus === "inactive"
                          ? { color: "#fff" }
                          : { color: theme.text },
                      ]}
                    >
                      Inactive
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: theme.error }]}
                  onPress={handleDeletePond}
                >
                  <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>

                <View style={{ width: 10 }} />

                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: theme.icon }]}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>

                <View style={{ width: 10 }} />

                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    { backgroundColor: theme.primary },
                  ]}
                  onPress={handleUpdatePond}
                >
                  <Text style={styles.buttonText}>Update</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  cardBody: {
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoText: {
    fontSize: 16,
  },
  dateText: {
    fontSize: 12,
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: 24,
    elevation: 5,
    width: "100%",
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  modalButton: {
    flex: 1,
    height: 45,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  statusContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "600",
  },
  statusButtons: {
    flexDirection: "row",
    gap: 10,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
  },
  statusButtonText: {
    fontWeight: "600",
  },
  selectorContainer: {
    marginBottom: 16,
  },
  chipsContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  chipText: {
    fontWeight: '600',
  },
});
