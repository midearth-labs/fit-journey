# FitJourney - Fitness Learning App UI

This is the frontend UI for the FitJourney fitness learning application. It provides an engaging, mobile-first interface for users to progress through 70 days of fitness education.

## Features

### 🏠 Home Page
- **Hero Section**: Overview of the 70-day learning journey with progress tracking
- **Learning Phases**: Visual representation of the 6-phase learning progression
- **Recent Articles**: Quick access to continue learning

### 📚 Categories Page
- **9 Learning Categories**: Each with clear descriptions and learning objectives
- **Progress Tracking**: Visual indicators showing completion status
- **Article Counts**: Dynamic loading of article and question counts

### 📖 Article Pages
- **Rich Content**: Full markdown support with images and formatting
- **Character Stories**: Engaging passages featuring 8 character archetypes
- **Key Takeaways**: Practical action items for each article
- **Quiz Integration**: Direct access to article-specific quizzes

### 🧠 Quiz System
- **Multiple Question Types**: Standalone and passage-based questions
- **Progress Tracking**: Visual progress bar and question counter
- **Character Integration**: Questions based on character scenarios
- **Score Tracking**: Persistent scoring and progress storage

### 📊 Progress Tracking
- **Overall Progress**: Percentage completion across all 70 days
- **Phase Progress**: Detailed breakdown by learning phase
- **Quiz Scores**: Track correct answers and learning outcomes
- **Local Storage**: Persistent progress across sessions

## Technical Implementation

### Architecture
- **Single Page Application**: Dynamic content loading without page refreshes
- **Component-Based**: Modular JavaScript classes for maintainability
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Progressive Enhancement**: Works without JavaScript for basic functionality

### Data Management
- **DataLoader Class**: Centralized data loading and caching
- **Local Storage**: Persistent user progress and preferences
- **AJAX Loading**: Dynamic content loading from JSON files
- **Error Handling**: Graceful fallbacks for missing content

### Styling
- **CSS Custom Properties**: Consistent theming and dark mode support
- **Modern CSS**: Flexbox, Grid, and modern layout techniques
- **Smooth Animations**: Engaging transitions and micro-interactions
- **Accessibility**: Proper contrast ratios and keyboard navigation

## File Structure

```
public/
├── index.html              # Main HTML file
├── css/
│   └── styles.css          # Complete CSS styling
├── js/
│   ├── data-loader.js      # Data loading and caching
│   └── app.js             # Main application controller
└── README.md              # This file
```

## Usage

1. **Open `index.html`** in a web browser
2. **Navigate** through categories and articles
3. **Take quizzes** to test your knowledge
4. **Track progress** in the progress page
5. **Switch themes** using the theme toggle

## Content Integration

The UI dynamically loads content from the `/src/data/content` directory:
- **Categories**: `categories/categories.json`
- **Articles**: `knowledge-base/{category}.json`
- **Questions**: `questions/{category}.json`

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile Browsers**: iOS Safari, Chrome Mobile, Samsung Internet
- **Progressive Web App**: Installable on mobile devices

## Customization

### Themes
- **Light Theme**: Default clean appearance
- **Dark Theme**: Toggle via theme button
- **Custom Themes**: Modify CSS custom properties

### Styling
- **Colors**: Update CSS custom properties in `:root`
- **Typography**: Modify font imports and font-family declarations
- **Layout**: Adjust grid and flexbox properties
- **Animations**: Customize transition and animation properties

## Performance

- **Lazy Loading**: Content loaded on demand
- **Caching**: Data cached after first load
- **Optimized Images**: Responsive image handling
- **Minimal Dependencies**: Only Font Awesome and Google Fonts

## Future Enhancements

- **Offline Support**: Service worker for offline functionality
- **Push Notifications**: Daily learning reminders
- **Social Features**: Share progress and compete with friends
- **Advanced Analytics**: Detailed learning insights
- **Accessibility**: Enhanced screen reader support
- **Internationalization**: Multi-language support

## Development

To modify or extend the UI:

1. **HTML Structure**: Update `index.html` for new pages/components
2. **Styling**: Modify `css/styles.css` for visual changes
3. **Functionality**: Update `js/app.js` for new features
4. **Data Loading**: Extend `js/data-loader.js` for new data sources

## License

This UI is part of the FitJourney fitness learning application.
