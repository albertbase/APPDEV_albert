import { useNavigation } from '@react-navigation/native';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { IMG, ROUTES } from '../util';

const HomeScreen = () => {
  const navigation = useNavigation();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: 'red',
      }}
    >
      <Image
        source={{
          uri: IMG.LOGO2,
          // uri: 'https://th.bing.com/th/id/R.5eb1959636a370b661bc91940fe49cee?rik=DiotHJlkKQR6dg&riu=http%3a%2f%2fwww.datwebdigital.com%2fDWD%2fwp-content%2fuploads%2f2012%2f06%2flogo-design.jpg&ehk=fa8lsC0cm1nXH1dOqP%2f9dC1ohF3%2bcobEoqkMOaxrV2I%3d&risl=&pid=ImgRaw&r=0',
        }}
        style={{ width: 200, height: 200 }}
      />
      <Text style={{ fontSize: 20 }}>HomeScreen</Text>

      {/* <Button title="GO TO PROFILE" /> */}

      <TouchableOpacity
        onPress={() => {
          navigation.navigate(ROUTES.PROFILE);
        }}
      >
        <View
          style={{
            backgroundColor: 'green',
            padding: 10,
            borderRadius: 20,
          }}
        >
          <Text style={{ fontSize: 40, color: 'white' }}>GO TO PROFILE</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;