// Worldwide cascade: country -> cities. Area is free-text + quick picks so the
// portal works globally without shipping a multi-MB geo dataset.
export const COUNTRIES: Record<string, string[]> = {
  'United States': ['New York', 'Los Angeles', 'Chicago', 'San Francisco', 'Seattle', 'Austin', 'Boston', 'Miami'],
  'United Kingdom': ['London', 'Manchester', 'Birmingham', 'Edinburgh', 'Leeds', 'Bristol'],
  'Canada': ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa'],
  'India': ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Jaipur'],
  'Germany': ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne'],
  'France': ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice'],
  'Netherlands': ['Amsterdam', 'Rotterdam', 'Utrecht', 'The Hague'],
  'Spain': ['Madrid', 'Barcelona', 'Valencia', 'Seville'],
  'Italy': ['Rome', 'Milan', 'Naples', 'Florence'],
  'Australia': ['Sydney', 'Melbourne', 'Brisbane', 'Perth'],
  'Singapore': ['Singapore'],
  'UAE': ['Dubai', 'Abu Dhabi', 'Sharjah'],
  'Japan': ['Tokyo', 'Osaka', 'Kyoto'],
  'Brazil': ['São Paulo', 'Rio de Janeiro', 'Brasília'],
  'South Africa': ['Cape Town', 'Johannesburg', 'Durban'],
  'Other': ['Other city']
}

export const AREA_SUGGESTIONS = [
  'Downtown',
  'Central Station',
  'Airport',
  'University District',
  'Shopping Mall',
  'City Park',
  'Bus Stop',
  'Metro / Subway',
  'Cafe / Restaurant',
  'Library',
  'Gym / Stadium',
  'Beach / Lakefront'
]
