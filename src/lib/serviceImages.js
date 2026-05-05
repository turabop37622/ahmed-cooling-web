export const SERVICE_IMAGES = {
  'AC Repair': require('../../assets/ac_repair.png').default || require('../../assets/ac_repair.png'),
  'AC Installation': require('../../assets/ac_repair.png').default || require('../../assets/ac_repair.png'), // fallback
  'AC Deep Cleaning': require('../../assets/ac_deep_cleaning.png').default || require('../../assets/ac_deep_cleaning.png'),
  'AC Gas Refill': require('../../assets/ac_gas_refill.png').default || require('../../assets/ac_gas_refill.png'),
  'AC Compressor Repair': require('../../assets/ac_repair.png').default || require('../../assets/ac_repair.png'), // fallback
  'AC PCB Repair': require('../../assets/ac_pcb_repair.jpg').default || require('../../assets/ac_pcb_repair.jpg'),
  'AC Shifting': require('../../assets/ac_shifting.png').default || require('../../assets/ac_shifting.png'),
  'Central AC Service': require('../../assets/central_ac_service.png').default || require('../../assets/central_ac_service.png'),
  'Refrigerator Repair': require('../../assets/refrigerator_repair.png').default || require('../../assets/refrigerator_repair.png'),
  'Freezer Repair': require('../../assets/freezer_repair.png').default || require('../../assets/freezer_repair.png'),
  'Fridge Gas Refill': require('../../assets/fridge_gas_refill.png').default || require('../../assets/fridge_gas_refill.png'),
  'Fridge Thermostat Fix': require('../../assets/fridge_thermostat_fix.png').default || require('../../assets/fridge_thermostat_fix.png'),
  'Washing Machine Repair': require('../../assets/washing_machine_repair.png').default || require('../../assets/washing_machine_repair.png'),
  'Stove & Oven Repair': require('../../assets/stove_oven_repair.png').default || require('../../assets/stove_oven_repair.png'),
  'Microwave Repair': require('../../assets/microwave_repair.png').default || require('../../assets/microwave_repair.png'),
  'Water Dispenser Repair': require('../../assets/water_dispenser_repair.png').default || require('../../assets/water_dispenser_repair.png'),
  'Electrical Wiring Fix': require('../../assets/electrical_wiring_fix.png').default || require('../../assets/electrical_wiring_fix.png'),
  'UPS & Inverter Repair': require('../../assets/ups_inverter_repair.png').default || require('../../assets/ups_inverter_repair.png'),
};

export const getServiceImage = (serviceName) => {
  const image = SERVICE_IMAGES[serviceName];
  if (image) {
    return image.src ? image.src : image;
  }
  return null;
};
